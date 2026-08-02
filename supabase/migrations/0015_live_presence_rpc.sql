-- 0015: fix the presence heartbeat.
--
-- 0014 let members upsert their own live_presence row via RLS. That fails: supabase-js
-- .upsert() emits INSERT ... ON CONFLICT DO UPDATE, which needs read access to the
-- conflicting row — and members deliberately have no select policy on live_presence
-- (the roster is KC's alone). Verified failing: "new row violates row-level security
-- policy for table live_presence".
--
-- Replace it with a narrow security-definer RPC. The function can only ever write the
-- caller's own row (it takes no arguments and derives the user from auth.uid()), so
-- members now need NO direct privileges on the table at all — strictly tighter than
-- the policies it replaces.

drop policy if exists "live_presence_insert_own" on public.live_presence;
drop policy if exists "live_presence_update_own" on public.live_presence;

create or replace function public.live_heartbeat()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.live_presence (user_id, seen_at)
    values (auth.uid(), now())
  on conflict (user_id) do update set seen_at = now();
end;
$$;

revoke all on function public.live_heartbeat() from public, anon;
grant execute on function public.live_heartbeat() to authenticated;
