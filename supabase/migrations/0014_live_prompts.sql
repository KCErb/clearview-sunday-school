-- 0014: LIVE PROMPTS — in-class, real-time input.
--
-- Model: a session can be put in LIVE MODE (sessions.is_live). While it's live the class's
-- /live page says "we're live"; KC then opens one prepared prompt at a time and watches
-- responses arrive privately. Attribution is set per prompt by KC and enforced here:
-- on an 'anonymous' prompt the database itself refuses a row carrying an author_id.
--
-- Names never reach the class. The reveal flag exposes aggregate counts only.

-- ---------------------------------------------------------------------------
-- Live mode lives on the session. At most one session is live at a time.
-- ---------------------------------------------------------------------------
alter table public.sessions add column if not exists is_live boolean not null default false;

create unique index if not exists sessions_one_live on public.sessions (is_live) where is_live;

-- The class must be able to see a live session even if it isn't published yet.
drop policy if exists "sessions_read" on public.sessions;
create policy "sessions_read" on public.sessions for select to authenticated
  using (is_published or is_live or public.is_admin());

-- ---------------------------------------------------------------------------
create table if not exists public.live_prompts (
  id           bigint generated always as identity primary key,
  session_id   bigint not null references public.sessions (id) on delete cascade,
  kind         text not null check (kind in ('single','multi','text')),
  prompt       text not null,
  detail       text,                                   -- optional helper line
  attribution  text not null default 'anonymous' check (attribution in ('anonymous','named')),
  status       text not null default 'draft'     check (status in ('draft','open','closed')),
  reveal       boolean not null default false,         -- show the tally to the class
  sort_order   integer not null default 0,
  opened_at    timestamptz,
  closed_at    timestamptz,
  created_at   timestamptz not null default now()
);

-- One prompt open across the whole site (one class, one teacher).
create unique index if not exists live_prompts_one_open
  on public.live_prompts (status) where status = 'open';

create table if not exists public.live_options (
  id          bigint generated always as identity primary key,
  prompt_id   bigint not null references public.live_prompts (id) on delete cascade,
  label       text not null,
  sort_order  integer not null default 0
);

-- One row per SELECTED OPTION, so a multi-select answer is N rows. submission_id ties
-- those N rows back to one act of responding without recording who did it — it is how
-- "4 people responded" stays countable on an anonymous prompt.
create table if not exists public.live_responses (
  id             bigint generated always as identity primary key,
  prompt_id      bigint not null references public.live_prompts (id) on delete cascade,
  option_id      bigint references public.live_options (id) on delete cascade, -- null for text
  body           text,                                                         -- null for votes
  submission_id  uuid not null default gen_random_uuid(),
  author_id      uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint live_responses_shape check (option_id is not null or body is not null)
);

create index if not exists live_responses_prompt_idx on public.live_responses (prompt_id);

-- Presence: "how many people are actually on the app right now". Keyed by user so two
-- devices don't double-count. Heartbeated by the /live page; admin reads the count.
create table if not exists public.live_presence (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  seen_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.live_prompts   enable row level security;
alter table public.live_options   enable row level security;
alter table public.live_responses enable row level security;
alter table public.live_presence  enable row level security;

-- Drafts are KC's alone. The class sees open/closed prompts only while the session is live.
drop policy if exists "live_prompts_read" on public.live_prompts;
create policy "live_prompts_read" on public.live_prompts for select to authenticated
  using (
    public.is_admin() or (
      status in ('open','closed')
      and exists (select 1 from public.sessions s where s.id = session_id and s.is_live)
    )
  );
drop policy if exists "live_prompts_admin" on public.live_prompts;
create policy "live_prompts_admin" on public.live_prompts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "live_options_read" on public.live_options;
create policy "live_options_read" on public.live_options for select to authenticated
  using (exists (
    select 1 from public.live_prompts p
    join public.sessions s on s.id = p.session_id
    where p.id = prompt_id
      and (public.is_admin() or (p.status in ('open','closed') and s.is_live))
  ));
drop policy if exists "live_options_admin" on public.live_options;
create policy "live_options_admin" on public.live_options for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- The prompt must be OPEN, its session LIVE, and the row must match the attribution mode.
-- This is what makes the class-facing banner's promise true.
drop policy if exists "live_responses_insert" on public.live_responses;
create policy "live_responses_insert" on public.live_responses for insert to authenticated
  with check (exists (
    select 1 from public.live_prompts p
    join public.sessions s on s.id = p.session_id
    where p.id = live_responses.prompt_id
      and p.status = 'open'
      and s.is_live
      and (
        (p.attribution = 'anonymous' and live_responses.author_id is null) or
        (p.attribution = 'named'     and live_responses.author_id = auth.uid())
      )
  ));

-- Named responders own their rows (so they can change their mind while it's open).
-- Note there is deliberately NO member read path to anonymous rows — not even for the
-- person who wrote one. The row is genuinely detached.
drop policy if exists "live_responses_own" on public.live_responses;
create policy "live_responses_own" on public.live_responses for select to authenticated
  using (author_id = auth.uid());
drop policy if exists "live_responses_delete_own" on public.live_responses;
create policy "live_responses_delete_own" on public.live_responses for delete to authenticated
  using (author_id = auth.uid());
drop policy if exists "live_responses_admin" on public.live_responses;
create policy "live_responses_admin" on public.live_responses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "live_presence_insert_own" on public.live_presence;
create policy "live_presence_insert_own" on public.live_presence for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "live_presence_update_own" on public.live_presence;
create policy "live_presence_update_own" on public.live_presence for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "live_presence_admin" on public.live_presence;
create policy "live_presence_admin" on public.live_presence for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Class-facing tally: aggregate counts only, and only when KC has revealed.
-- No body, no author_id, no rows for un-revealed prompts. Options with zero votes
-- still appear (left join) — a revealed tally that dropped the unpopular option
-- would misrepresent the room.
-- ---------------------------------------------------------------------------
drop view if exists public.live_tallies;
create view public.live_tallies as
  select o.prompt_id, o.id as option_id, o.label, o.sort_order,
         count(r.id)::int as votes
  from public.live_options o
  join public.live_prompts p on p.id = o.prompt_id
  left join public.live_responses r on r.option_id = o.id
  where p.reveal = true
  group by o.prompt_id, o.id, o.label, o.sort_order;

grant select on public.live_tallies to authenticated;

-- ---------------------------------------------------------------------------
-- Helpers. security invoker: RLS still applies, so only KC can actually run these.
-- ---------------------------------------------------------------------------
create or replace function public.set_live_session(p_id bigint, p_live boolean)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_live then
    update public.sessions set is_live = false where is_live and id <> p_id;
    update public.sessions set is_live = true where id = p_id;
  else
    -- Going off the air closes whatever was open.
    update public.live_prompts set status = 'closed', closed_at = now() where status = 'open';
    update public.sessions set is_live = false where id = p_id;
  end if;
end;
$$;

create or replace function public.open_live_prompt(p_id bigint)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.live_prompts set status = 'closed', closed_at = now()
    where status = 'open' and id <> p_id;
  update public.live_prompts
    set status = 'open', opened_at = now(), closed_at = null, reveal = false
    where id = p_id;
end;
$$;

create or replace function public.close_live_prompt(p_id bigint)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.live_prompts set status = 'closed', closed_at = now() where id = p_id;
end;
$$;
