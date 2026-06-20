-- 0007: section the lesson by Come, Follow Me week. Questions carry a cfm_week
-- (null = home-centered). Add per-section links (the CFM manual link is derived;
-- KC can add conference talks) and an open-ended "share an insight" per section.

alter table public.questions add column if not exists cfm_week integer; -- null = home
update public.questions set cfm_week = 25 where category = 'study' and cfm_week is null;

create table if not exists public.section_links (
  id          bigint generated always as identity primary key,
  session_id  bigint not null references public.sessions (id) on delete cascade,
  cfm_week    integer,             -- null = home section
  label       text not null,
  url         text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.section_links enable row level security;
create policy "section_links_read" on public.section_links for select to authenticated using (true);
create policy "section_links_admin" on public.section_links for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.insights (
  id            bigint generated always as identity primary key,
  session_id    bigint not null references public.sessions (id) on delete cascade,
  cfm_week      integer,           -- null = home section
  body          text not null,
  is_anonymous  boolean not null default false,
  author_id     uuid references auth.users (id) on delete set null,
  share_pref    text not null default 'verbatim_ok' check (share_pref in ('verbatim_ok','summarize_only')),
  published     boolean not null default false,
  edited_at     timestamptz,
  created_at    timestamptz not null default now()
);
alter table public.insights enable row level security;
create policy "insights_insert" on public.insights for insert to authenticated
  with check ((is_anonymous and author_id is null) or (not is_anonymous and author_id = auth.uid()));
create policy "insights_select_own" on public.insights for select to authenticated using (author_id = auth.uid());
create policy "insights_update_own" on public.insights for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "insights_delete_own" on public.insights for delete to authenticated using (author_id = auth.uid());
create policy "insights_admin_all" on public.insights for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists insights_member_edit on public.insights;
create trigger insights_member_edit before update on public.insights
  for each row execute function public.answers_member_edit_guard();

create or replace view public.shared_insights as
  select id, session_id, cfm_week, body, share_pref, created_at
  from public.insights where published = true;
grant select on public.shared_insights to authenticated, anon;

-- Seed a couple of example "talk" links so the links card shows the feature.
insert into public.section_links (session_id, cfm_week, label, url, sort_order)
select s.id, null, 'Teaching in the Savior''s Way', 'https://www.churchofjesuschrist.org/study/manual/teaching-in-the-saviors-way?lang=eng', 1
from public.sessions s where s.teach_date = '2026-06-21'
and not exists (select 1 from public.section_links sl where sl.session_id = s.id and sl.cfm_week is null);

insert into public.section_links (session_id, cfm_week, label, url, sort_order)
select s.id, 25, 'Agency: Essential to the Plan of Life (D. Todd Christofferson)', 'https://www.churchofjesuschrist.org/study/general-conference/2010/10/agency-essential-to-the-plan-of-life?lang=eng', 1
from public.sessions s where s.teach_date = '2026-06-21'
and not exists (select 1 from public.section_links sl where sl.session_id = s.id and sl.cfm_week = 25);
