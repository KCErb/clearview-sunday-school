-- CWASS storage: private bucket for the future audio/video submission phase.
-- Files are expected to live under "<user_id>/<filename>" so RLS can scope by owner.
-- No upload UI ships in the bootstrap; this just provisions the bucket + policies.

insert into storage.buckets (id, name, public)
values ('submission-media', 'submission-media', false)
on conflict (id) do nothing;

drop policy if exists "media_insert_own" on storage.objects;
create policy "media_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submission-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "media_select_own_or_admin" on storage.objects;
create policy "media_select_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'submission-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
