-- 0004: members own their identified answers — they can read/edit/delete their own.
-- Editing by a non-admin un-publishes the answer (KC must re-approve) and stamps edited_at.
-- Anonymous answers have no author_id, so they remain fire-and-forget (not editable).

alter table public.answers add column if not exists edited_at timestamptz;

create policy "answers_select_own" on public.answers
  for select to authenticated using (author_id = auth.uid());
create policy "answers_update_own" on public.answers
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "answers_delete_own" on public.answers
  for delete to authenticated using (author_id = auth.uid());

create or replace function public.answers_member_edit_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    new.published := false;
    new.edited_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists answers_member_edit on public.answers;
create trigger answers_member_edit
  before update on public.answers
  for each row execute function public.answers_member_edit_guard();
