-- Private, editable suggestions alongside preset selections. No changes to existing votes.
begin;
create table public.poll_write_ins (
  id uuid primary key,
  poll_id bigint not null references public.polls(id) on delete cascade,
  token_hash text not null,
  body text not null check (length(btrim(body)) between 1 and 2000),
  revision integer not null default 1,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index poll_write_ins_owner on public.poll_write_ins(poll_id, token_hash);
alter table public.poll_write_ins enable row level security;
revoke all on public.poll_write_ins from public, anon, authenticated;

create function public.poll_my_write_ins(p_id bigint, p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_token is null or length(p_token) < 64 or length(p_token) > 128 then raise exception 'Invalid response token'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
    'id', w.id, 'body', w.body, 'revision', w.revision, 'created_at', w.created_at
  ) order by w.created_at, w.id), '[]'::jsonb)
  from public.poll_write_ins w where w.poll_id = p_id and not w.deleted
    and w.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex'));
end;
$$;

create function public.poll_write_in_save(
  p_id bigint, p_token text, p_write_in_id uuid, p_body text, p_revision integer, p_epoch timestamptz
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.polls; w public.poll_write_ins; h text; current_poll bigint; normalized text;
begin
  if p_token is null or length(p_token) < 64 or length(p_token) > 128 then raise exception 'Invalid response token'; end if;
  if p_write_in_id is null or p_revision is null or p_revision < 0 then raise exception 'Invalid suggestion'; end if;
  normalized := btrim(p_body);
  if p_body is not null and length(normalized) not between 1 and 2000 then
    raise exception 'Enter a suggestion of up to 2,000 characters';
  end if;
  -- Same lock order as preset answers and teacher controls; no writes after closure.
  select current_id into current_poll from public.poll_room where singleton for share;
  select * into p from public.polls where id = p_id for update;
  if p.id is null or p.status <> 'open' or current_poll is distinct from p_id or p.opened_at is distinct from p_epoch then
    raise exception 'Question closed';
  end if;
  h := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  select * into w from public.poll_write_ins where id = p_write_in_id for update;
  if w.id is not null and (w.poll_id <> p_id or w.token_hash <> h) then
    raise exception 'Suggestion unavailable' using errcode = '42501';
  end if;
  -- Stable client IDs plus revisions make retries safe after a lost acknowledgement.
  if w.id is not null and w.revision = p_revision + 1 and
      ((p_body is null and w.deleted) or (p_body is not null and not w.deleted and w.body = normalized)) then
    return jsonb_build_object('id',w.id,'body',w.body,'revision',w.revision,'created_at',w.created_at,'deleted',w.deleted);
  end if;
  if p_revision <> coalesce(w.revision, 0) then raise exception 'Stale revision'; end if;
  if w.id is null then
    if p_body is null then raise exception 'Suggestion unavailable'; end if;
    insert into public.poll_write_ins(id,poll_id,token_hash,body)
      values(p_write_in_id,p_id,h,normalized) returning * into w;
  else
    if w.deleted then raise exception 'Suggestion unavailable'; end if;
    update public.poll_write_ins set body = coalesce(normalized, body), deleted = p_body is null,
      revision = revision + 1, updated_at = now() where id = p_write_in_id returning * into w;
  end if;
  update public.polls set locked = true where id = p_id;
  return jsonb_build_object('id',w.id,'body',w.body,'revision',w.revision,'created_at',w.created_at,'deleted',w.deleted);
end;
$$;

create or replace function public.poll_library() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare ps jsonb; totals jsonb;
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(public.poll_document(p.id) order by p.created_at desc, p.id desc), '[]'::jsonb) into ps from public.polls p;
  select coalesce(jsonb_object_agg(p.id, jsonb_build_object(
    'respondents', (select count(*) from (
      select a.token_hash from public.poll_answers a where a.poll_id = p.id and cardinality(a.selection) > 0
      union
      select w.token_hash from public.poll_write_ins w where w.poll_id = p.id and not w.deleted
    ) responders),
    'counts', (select coalesce(jsonb_object_agg(o.id, (select count(*) from public.poll_answers a where a.poll_id = p.id and o.id = any(a.selection))), '{}'::jsonb) from public.poll_options o where o.poll_id = p.id),
    'write_ins', (select coalesce(jsonb_agg(jsonb_build_object(
      'id',w.id,'body',w.body,'revision',w.revision,'created_at',w.created_at
    ) order by w.created_at,w.id), '[]'::jsonb) from public.poll_write_ins w where w.poll_id = p.id and not w.deleted)
  )), '{}'::jsonb) into totals from public.polls p;
  return jsonb_build_object('polls', ps, 'currentId', (select current_id from public.poll_room where singleton), 'results', totals);
end;
$$;

revoke all on function public.poll_my_write_ins(bigint,text), public.poll_write_in_save(bigint,text,uuid,text,integer,timestamptz) from public, anon, authenticated;
grant execute on function public.poll_my_write_ins(bigint,text), public.poll_write_in_save(bigint,text,uuid,text,integer,timestamptz) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
