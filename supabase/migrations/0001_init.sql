-- CWASS initial schema: profiles, schedule, submissions + RLS, trigger, seed.
-- Applied via the Supabase Management API database/query endpoint during bootstrap.
-- Admin is matched by email (the instructor). Change ADMIN email in is_admin()/trigger
-- if the instructor changes.

-- ---------------------------------------------------------------------------
-- Helper: is the current user the instructor (admin)?
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'email') = 'iamkcerb@gmail.com', false);
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, populated from signup metadata via trigger
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text,
  last_name   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_self_or_admin" on public.profiles
  for select to authenticated using (auth.uid() = id or public.is_admin());
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- schedule: the weekly study plan. Everyone signed in can read; admin writes.
-- ---------------------------------------------------------------------------
create table if not exists public.schedule (
  id          bigint generated always as identity primary key,
  week_date   date,
  title       text not null,
  reading     text,
  notes       text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.schedule enable row level security;

create policy "schedule_select_authenticated" on public.schedule
  for select to authenticated using (true);
create policy "schedule_admin_write" on public.schedule
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- submissions: answers & questions. Insert your own; read your own (admin: all).
-- media_path is reserved for the future audio/video phase.
-- ---------------------------------------------------------------------------
create table if not exists public.submissions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('answer', 'question')),
  body        text not null,
  media_path  text,
  created_at  timestamptz not null default now()
);

alter table public.submissions enable row level security;

create policy "submissions_insert_own" on public.submissions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "submissions_select_own_or_admin" on public.submissions
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

create index if not exists submissions_user_created_idx
  on public.submissions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Trigger: create a profile row when a new auth user is created, copying the
-- first/last name from signup metadata and flagging the instructor as admin.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, is_admin)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    coalesce(new.email = 'iamkcerb@gmail.com', false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Seed: a few sample weeks (placeholder content the instructor can edit).
-- ---------------------------------------------------------------------------
insert into public.schedule (week_date, title, reading, notes, sort_order) values
  ('2026-06-21', 'The Creation',        'Genesis 1–2; Moses 2–3; Abraham 4–5', 'Sample week — edit me. What stands out about the pattern of creation?', 1),
  ('2026-06-28', 'The Fall',            'Genesis 3–4; Moses 4–5',              'Sample week — edit me. How does the Fall make our progression possible?', 2),
  ('2026-07-05', 'Noah and the Flood',  'Genesis 6–11; Moses 8',               'Sample week — edit me. What does the Ark teach about covenants?', 3)
on conflict do nothing;
