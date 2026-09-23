-- Lesson decks: slides live in the database so the TV, the teacher's phone and the class
-- all read the same "current slide". Live state rides on the existing poll_room singleton.
begin;
create table public.decks (
  id bigint generated always as identity primary key,
  title text not null check (length(btrim(title)) between 1 and 200),
  subtitle text not null default '' check (length(subtitle) <= 200),
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.slides (
  id bigint generated always as identity primary key,
  deck_id bigint not null references public.decks(id) on delete cascade,
  idx integer not null check (idx >= 0),
  label text not null default '' check (length(label) <= 200),
  html text not null check (length(html) between 1 and 300000),
  notes text not null default '' check (length(notes) <= 20000),
  poll_id bigint references public.polls(id) on delete set null,
  unique(deck_id, idx)
);
create index slides_poll on public.slides(poll_id) where poll_id is not null;
alter table public.poll_room
  add column deck_id bigint references public.decks(id) on delete set null,
  add column slide_idx integer not null default 0;

-- Same posture as polls: tables are reachable only through the functions below.
alter table public.decks enable row level security;
alter table public.slides enable row level security;
revoke all on public.decks, public.slides from public, anon, authenticated;
revoke all on sequence public.decks_id_seq, public.slides_id_seq from public, anon, authenticated;

create function public.slide_document(s public.slides, p_notes boolean) returns jsonb
language sql immutable security definer set search_path = '' as $$
  select jsonb_build_object('id', s.id, 'idx', s.idx, 'label', s.label, 'html', s.html, 'poll_id', s.poll_id)
    || case when p_notes then jsonb_build_object('notes', s.notes) else '{}'::jsonb end;
$$;
revoke all on function public.slide_document(public.slides, boolean) from public, anon, authenticated;

-- Arriving at a slide: the room lock is taken first, then the poll, exactly as poll_action does.
create function public.deck_arrive(p_idx integer) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.poll_room; total integer; leaving bigint; arriving bigint; p public.polls;
begin
  select * into r from public.poll_room where singleton for update;
  if r.deck_id is null then raise exception 'No live lesson'; end if;
  select count(*) into total from public.slides where deck_id = r.deck_id;
  if p_idx is null or p_idx < 0 or p_idx >= total then raise exception 'Slide out of range'; end if;
  select poll_id into leaving from public.slides where deck_id = r.deck_id and idx = r.slide_idx;
  select poll_id into arriving from public.slides where deck_id = r.deck_id and idx = p_idx;
  update public.poll_room set slide_idx = p_idx where singleton;
  -- Only the slide's own question closes behind us; one opened by hand stays open.
  if leaving is not null and leaving is distinct from arriving and r.current_id = leaving then
    update public.polls set status = 'closed' where id = leaving and status = 'open';
  end if;
  if arriving is not null then
    select * into p from public.polls where id = arriving for update;
    if p.id is not null then
      if p.status <> 'open' then
        update public.polls set status = 'closed' where status = 'open';
        update public.polls set status = 'open', opened_at = clock_timestamp() where id = arriving;
      end if;
      update public.poll_room set current_id = arriving where singleton;
    end if;
  end if;
end;
$$;
revoke all on function public.deck_arrive(integer) from public, anon, authenticated;

create function public.deck_save(p_deck jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare d_id bigint; t text; sub text; n integer; carry jsonb; result bigint;
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  d_id := nullif(p_deck->>'id', '')::bigint;
  t := btrim(coalesce(p_deck->>'title', ''));
  sub := btrim(coalesce(p_deck->>'subtitle', ''));
  if length(t) not between 1 and 200 or length(sub) > 200 then raise exception 'Enter a lesson title (up to 200 characters) and a subtitle up to 200'; end if;
  if jsonb_typeof(p_deck->'slides') <> 'array' then raise exception 'A lesson needs slides'; end if;
  select count(*) into n from jsonb_array_elements(p_deck->'slides');
  if n not between 1 and 200 then raise exception 'A lesson needs 1 to 200 slides'; end if;
  if exists (select 1 from jsonb_array_elements(p_deck->'slides') s(v)
             where coalesce(length(s.v->>'html'), 0) not between 1 and 300000
                or coalesce(length(s.v->>'label'), 0) > 200
                or coalesce(length(s.v->>'notes'), 0) > 20000) then
    raise exception 'Each slide needs HTML up to 300,000 characters, a label up to 200, and notes up to 20,000';
  end if;
  perform 1 from public.poll_room where singleton for update;
  carry := '{}'::jsonb;
  if d_id is null then
    insert into public.decks(title, subtitle) values(t, sub) returning id into result;
  else
    if exists(select 1 from public.poll_room where singleton and deck_id = d_id) then raise exception 'End the live lesson first'; end if;
    perform 1 from public.decks where id = d_id for update;
    if not found then raise exception 'Lesson not found'; end if;
    update public.decks set title = t, subtitle = sub where id = d_id;
    -- A re-import replaces the slides but keeps the notes and attached questions at each position.
    select coalesce(jsonb_object_agg(idx::text, jsonb_build_object('notes', notes, 'poll_id', poll_id)), '{}'::jsonb)
      into carry from public.slides where deck_id = d_id;
    delete from public.slides where deck_id = d_id;
    result := d_id;
  end if;
  insert into public.slides(deck_id, idx, label, html, notes, poll_id)
  select result, (s.o - 1)::integer, btrim(coalesce(s.v->>'label', '')), s.v->>'html',
         coalesce(nullif(btrim(coalesce(s.v->>'notes', '')), ''), carry->(s.o - 1)::text->>'notes', ''),
         (carry->(s.o - 1)::text->>'poll_id')::bigint
  from jsonb_array_elements(p_deck->'slides') with ordinality as s(v, o);
  return result;
end;
$$;

create function public.deck_publish(p_id bigint, p_published boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  update public.decks set published = coalesce(p_published, false) where id = p_id;
  if not found then raise exception 'Lesson not found'; end if;
end;
$$;

create function public.deck_delete(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  perform 1 from public.poll_room where singleton for update;
  if exists(select 1 from public.poll_room where singleton and deck_id = p_id) then raise exception 'End the live lesson first'; end if;
  delete from public.decks where id = p_id;
  if not found then raise exception 'Lesson not found'; end if;
end;
$$;

create function public.slide_set_poll(p_slide_id bigint, p_poll_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if p_poll_id is not null and (select count(*) from public.poll_options where poll_id = p_poll_id) < 2 then
    raise exception 'At least two choices required';
  end if;
  update public.slides set poll_id = p_poll_id where id = p_slide_id;
  if not found then raise exception 'Slide not found'; end if;
end;
$$;

create function public.slide_set_notes(p_slide_id bigint, p_notes text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if length(coalesce(p_notes, '')) > 20000 then raise exception 'Notes can be up to 20,000 characters'; end if;
  update public.slides set notes = coalesce(p_notes, '') where id = p_slide_id;
  if not found then raise exception 'Slide not found'; end if;
end;
$$;

create function public.deck_go_live(p_deck_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  perform 1 from public.poll_room where singleton for update;
  if not exists(select 1 from public.decks where id = p_deck_id) then raise exception 'Lesson not found'; end if;
  if not exists(select 1 from public.slides where deck_id = p_deck_id and idx = 0) then raise exception 'That lesson has no slides'; end if;
  update public.poll_room set deck_id = p_deck_id, slide_idx = 0 where singleton;
  perform public.deck_arrive(0);
end;
$$;

create function public.deck_show(p_idx integer) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.poll_room;
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  select * into r from public.poll_room where singleton for update;
  if r.deck_id is null then raise exception 'No live lesson'; end if;
  if p_idx = r.slide_idx then return; end if;
  perform public.deck_arrive(p_idx);
end;
$$;

create function public.deck_end_live() returns void
language plpgsql security definer set search_path = '' as $$
declare r public.poll_room;
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  select * into r from public.poll_room where singleton for update;
  if r.deck_id is not null and r.current_id is not null
     and exists(select 1 from public.slides where deck_id = r.deck_id and poll_id = r.current_id) then
    update public.polls set status = 'closed' where id = r.current_id and status = 'open';
  end if;
  update public.poll_room set deck_id = null, slide_idx = 0 where singleton;
end;
$$;

create function public.deck_library() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare ds jsonb; r public.poll_room;
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator access required' using errcode = '42501'; end if;
  select * into r from public.poll_room where singleton;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id, 'title', d.title, 'subtitle', d.subtitle, 'published', d.published, 'created_at', d.created_at,
    'count', (select count(*) from public.slides s where s.deck_id = d.id),
    'slides', coalesce((select jsonb_agg(public.slide_document(s, true) order by s.idx) from public.slides s where s.deck_id = d.id), '[]'::jsonb)
  ) order by d.created_at desc, d.id desc), '[]'::jsonb) into ds from public.decks d;
  return jsonb_build_object('decks', ds, 'live', jsonb_build_object('deck_id', r.deck_id, 'slide_idx', r.slide_idx));
end;
$$;

create function public.stage_current() returns jsonb
language sql stable security definer set search_path = '' as $$
  -- The live deck is the only unpublished deck that can surface here, and notes never leave deck_library.
  select jsonb_build_object(
    'deck', jsonb_build_object('id', d.id, 'title', d.title),
    'slide', public.slide_document(s, false),
    'count', (select count(*) from public.slides x where x.deck_id = d.id))
  from public.poll_room r
  join public.decks d on d.id = r.deck_id
  join public.slides s on s.deck_id = d.id and s.idx = r.slide_idx
  where r.singleton;
$$;

create function public.deck_list() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id, 'title', d.title, 'subtitle', d.subtitle, 'created_at', d.created_at,
    'count', (select count(*) from public.slides s where s.deck_id = d.id)
  ) order by d.created_at desc, d.id desc), '[]'::jsonb)
  from public.decks d where d.published;
$$;

create function public.deck_slides(p_deck_id bigint) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'deck', jsonb_build_object('id', d.id, 'title', d.title, 'subtitle', d.subtitle, 'created_at', d.created_at,
      'count', (select count(*) from public.slides s where s.deck_id = d.id)),
    'slides', coalesce((select jsonb_agg(public.slide_document(s, false) order by s.idx) from public.slides s where s.deck_id = d.id), '[]'::jsonb))
  from public.decks d where d.id = p_deck_id and d.published;
$$;

revoke all on function public.deck_save(jsonb), public.deck_publish(bigint, boolean), public.deck_delete(bigint),
  public.slide_set_poll(bigint, bigint), public.slide_set_notes(bigint, text), public.deck_go_live(bigint),
  public.deck_show(integer), public.deck_end_live(), public.deck_library(), public.stage_current(),
  public.deck_list(), public.deck_slides(bigint) from public, anon, authenticated;
grant execute on function public.stage_current(), public.deck_list(), public.deck_slides(bigint) to anon, authenticated;
grant execute on function public.deck_save(jsonb), public.deck_publish(bigint, boolean), public.deck_delete(bigint),
  public.slide_set_poll(bigint, bigint), public.slide_set_notes(bigint, text), public.deck_go_live(bigint),
  public.deck_show(integer), public.deck_end_live(), public.deck_library() to authenticated;

-- Slide images uploaded by the import script. Skipped on a bare Postgres (CI has no storage schema).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets(id, name, public) values('deck-media', 'deck-media', true) on conflict (id) do nothing;
    execute $p$create policy deck_media_public_read on storage.objects for select using (bucket_id = 'deck-media')$p$;
    execute $p$create policy deck_media_admin_write on storage.objects for all to authenticated
      using (bucket_id = 'deck-media' and public.is_admin()) with check (bucket_id = 'deck-media' and public.is_admin())$p$;
  end if;
end;
$$;
notify pgrst, 'reload schema';
commit;
