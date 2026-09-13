-- Independent, anonymous class input. Legacy lessons and live prompts stay untouched.
begin;
create table public.polls (
  id bigint generated always as identity primary key,
  question text not null check (length(btrim(question)) between 1 and 1000),
  detail text not null default '' check (length(detail) <= 2000),
  kind text not null check (kind in ('single','multi')),
  status text not null default 'draft' check (status in ('draft','open','closed')),
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  opened_at timestamptz
);
create unique index polls_one_open on public.polls(status) where status = 'open';
create table public.poll_options (
  id bigint generated always as identity primary key,
  poll_id bigint not null references public.polls(id) on delete cascade,
  label text not null check (length(btrim(label)) between 1 and 500),
  sort_order integer not null
);
create index poll_options_poll on public.poll_options(poll_id);
create table public.poll_answers (
  poll_id bigint not null references public.polls(id) on delete cascade,
  token_hash text not null,
  selection bigint[] not null default '{}',
  revision integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key(poll_id, token_hash)
);
create table public.poll_room (
  singleton boolean primary key default true check(singleton),
  current_id bigint references public.polls(id) on delete set null
);
insert into public.poll_room(singleton) values(true);

-- Tables are only accessible through the constrained functions below, including for admins.
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_answers enable row level security;
alter table public.poll_room enable row level security;
revoke all on public.polls, public.poll_options, public.poll_answers, public.poll_room from public, anon, authenticated;
revoke all on sequence public.polls_id_seq, public.poll_options_id_seq from public, anon, authenticated;

create function public.poll_document(p_id bigint) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(p) || jsonb_build_object('options', coalesce((
    select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label) order by o.sort_order)
    from public.poll_options o where o.poll_id = p.id
  ), '[]'::jsonb)) from public.polls p where p.id = p_id;
$$;
revoke all on function public.poll_document(bigint) from public, anon, authenticated;

create function public.poll_current() returns jsonb
language sql stable security definer set search_path = '' as $$
  -- Public output never contains response data, history, or whether anyone has answered.
  select (public.poll_document(r.current_id) - 'locked') || '{"locked":false}'::jsonb
  from public.poll_room r where r.singleton;
$$;

create function public.poll_my_answer(p_id bigint, p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_token is null or length(p_token) < 64 or length(p_token) > 128 then raise exception 'Invalid response token'; end if;
  select jsonb_build_object('selection', a.selection, 'revision', a.revision) into result
    from public.poll_answers a where a.poll_id = p_id
    and a.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  return coalesce(result, '{"selection":[],"revision":0}'::jsonb);
end;
$$;

create function public.poll_answer(p_id bigint, p_token text, p_selection bigint[], p_revision integer, p_epoch timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.polls; a public.poll_answers; h text; selected bigint[]; current_poll bigint;
begin
  if p_token is null or length(p_token) < 64 or length(p_token) > 128 then raise exception 'Invalid response token'; end if;
  -- All mutations lock room then poll: opening, closing, editing, and answering cannot race.
  select current_id into current_poll from public.poll_room where singleton for share;
  select * into p from public.polls where id = p_id for update;
  if p.id is null or p.status <> 'open' or current_poll is distinct from p_id or p.opened_at is distinct from p_epoch then
    raise exception 'Question closed';
  end if;
  if p_selection is null or cardinality(p_selection) > 50 or array_position(p_selection, null) is not null then raise exception 'Invalid choices'; end if;
  select coalesce(array_agg(distinct v order by v), '{}'::bigint[]) into selected from unnest(p_selection) v;
  if p.kind = 'single' and cardinality(selected) > 1 then raise exception 'Choose one option'; end if;
  if exists(select 1 from unnest(selected) v where not exists(select 1 from public.poll_options o where o.poll_id = p_id and o.id = v)) then raise exception 'Invalid choices'; end if;
  h := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  select * into a from public.poll_answers where poll_id = p_id and token_hash = h;
  if p_revision is null or p_revision <> coalesce(a.revision, 0) then raise exception 'Stale revision'; end if;
  insert into public.poll_answers(poll_id, token_hash, selection, revision) values(p_id, h, selected, coalesce(a.revision, 0) + 1)
    on conflict(poll_id, token_hash) do update set selection = excluded.selection, revision = excluded.revision, updated_at = now()
    returning * into a;
  if cardinality(selected) > 0 then update public.polls set locked = true where id = p_id; end if;
  return jsonb_build_object('selection', a.selection, 'revision', a.revision);
end;
$$;

create function public.poll_library() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare ps jsonb; totals jsonb;
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(public.poll_document(p.id) order by p.created_at desc, p.id desc), '[]'::jsonb) into ps from public.polls p;
  select coalesce(jsonb_object_agg(p.id, jsonb_build_object(
    'respondents', (select count(*) from public.poll_answers a where a.poll_id = p.id and cardinality(a.selection) > 0),
    'counts', (select coalesce(jsonb_object_agg(o.id, (select count(*) from public.poll_answers a where a.poll_id = p.id and o.id = any(a.selection))), '{}'::jsonb) from public.poll_options o where o.poll_id = p.id)
  )), '{}'::jsonb) into totals from public.polls p;
  return jsonb_build_object('polls', ps, 'currentId', (select current_id from public.poll_room where singleton), 'results', totals);
end;
$$;

create function public.poll_save(p_id bigint, p_question text, p_detail text, p_kind text, p_labels text[]) returns bigint
language plpgsql security definer set search_path = '' as $$
declare p public.polls; result bigint;
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if p_question is null or length(btrim(p_question)) not between 1 and 1000 or length(coalesce(p_detail,'')) > 2000 then raise exception 'Enter a question (up to 1,000 characters) and helper text up to 2,000 characters'; end if;
  if p_kind is null or p_kind not in ('single','multi') then raise exception 'Invalid question type'; end if;
  if p_labels is null or cardinality(p_labels) not between 2 and 50 or exists(select 1 from unnest(p_labels) label where label is null or length(btrim(label)) not between 1 and 500) then raise exception 'Enter 2–50 nonempty choices, each up to 500 characters'; end if;
  perform 1 from public.poll_room where singleton for update;
  if p_id is null then
    insert into public.polls(question, detail, kind) values(btrim(p_question), btrim(coalesce(p_detail,'')), p_kind) returning id into result;
  else
    select * into p from public.polls where id = p_id for update;
    if p.id is null then raise exception 'Question not found'; end if;
    if p.locked or p.status = 'open' then raise exception 'Duplicate this question to edit it'; end if;
    update public.polls set question = btrim(p_question), detail = btrim(coalesce(p_detail,'')), kind = p_kind where id = p_id;
    delete from public.poll_options where poll_id = p_id;
    -- Empty answers from previously cleared, unanswered questions must not restore old option IDs.
    delete from public.poll_answers where poll_id = p_id;
    result := p_id;
  end if;
  insert into public.poll_options(poll_id,label,sort_order) select result,btrim(label),ordinality::int from unnest(p_labels) with ordinality as labels(label,ordinality);
  return result;
end;
$$;

create function public.poll_action(p_id bigint, p_action text) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.polls;
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  perform 1 from public.poll_room where singleton for update;
  select * into p from public.polls where id = p_id for update;
  if p.id is null then raise exception 'Question not found'; end if;
  if p_action = 'open' then
    if p.status = 'open' then return; end if;
    if (select count(*) from public.poll_options where poll_id = p_id) < 2 then raise exception 'At least two choices required'; end if;
    update public.polls set status = 'closed' where status = 'open';
    update public.polls set status = 'open', opened_at = clock_timestamp() where id = p_id;
    update public.poll_room set current_id = p_id where singleton;
  elsif p_action = 'close' then
    update public.polls set status = 'closed' where id = p_id and status = 'open';
  elsif p_action = 'delete' then
    if p.locked or p.status <> 'draft' then raise exception 'Only unanswered drafts can be deleted'; end if;
    delete from public.polls where id = p_id;
  else raise exception 'Unknown action'; end if;
end;
$$;

revoke all on function public.poll_current(), public.poll_my_answer(bigint,text), public.poll_answer(bigint,text,bigint[],integer,timestamptz), public.poll_library(), public.poll_save(bigint,text,text,text,text[]), public.poll_action(bigint,text) from public, anon, authenticated;
grant execute on function public.poll_current(), public.poll_my_answer(bigint,text), public.poll_answer(bigint,text,bigint[],integer,timestamptz) to anon, authenticated;
grant execute on function public.poll_library(), public.poll_save(bigint,text,text,text,text[]), public.poll_action(bigint,text) to authenticated;
notify pgrst, 'reload schema';
commit;
