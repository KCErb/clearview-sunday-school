-- The class's lesson list shows each lesson's first slide as its cover.
begin;
create or replace function public.deck_list() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id, 'title', d.title, 'subtitle', d.subtitle, 'created_at', d.created_at,
    'count', (select count(*) from public.slides s where s.deck_id = d.id),
    'cover', (select s.html from public.slides s where s.deck_id = d.id and s.idx = 0)
  ) order by d.created_at desc, d.id desc), '[]'::jsonb)
  from public.decks d where d.published;
$$;
revoke all on function public.deck_list() from public, anon, authenticated;
grant execute on function public.deck_list() to anon, authenticated;
notify pgrst, 'reload schema';
commit;
