-- CWASS 0003: replace bootstrap schedule/submissions with the /this-week model.
-- lessons (52 Come Follow Me 2026 weeks) → instructor questions → member answers,
-- plus member-asked inquiries. Anonymity = no author_id stored. Class members read
-- only what KC publishes, via safe views that never expose author_id.

drop table if exists public.submissions cascade;
drop table if exists public.schedule cascade;

-- ---------------------------------------------------------------------------
create table public.lessons (
  id          bigint generated always as identity primary key,
  cfm_week    integer not null unique,            -- 1..52; URL is derived from this
  title       text not null,                      -- scripture block, e.g. "1 Samuel 17–18; ..."
  week_start  date not null,
  week_end    date not null,
  created_at  timestamptz not null default now()
);
alter table public.lessons enable row level security;
create policy "lessons_read" on public.lessons for select to authenticated using (true);
create policy "lessons_admin" on public.lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
create table public.questions (
  id          bigint generated always as identity primary key,
  lesson_id   bigint not null references public.lessons (id) on delete cascade,
  prompt      text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.questions enable row level security;
create policy "questions_read" on public.questions for select to authenticated using (is_active or public.is_admin());
create policy "questions_admin" on public.questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- answers: anonymous => author_id IS NULL (identity genuinely not recorded).
create table public.answers (
  id            bigint generated always as identity primary key,
  question_id   bigint not null references public.questions (id) on delete cascade,
  body          text not null,
  is_anonymous  boolean not null default false,
  author_id     uuid references auth.users (id) on delete set null,
  share_pref    text not null default 'verbatim_ok' check (share_pref in ('verbatim_ok','summarize_only')),
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);
alter table public.answers enable row level security;
-- must be signed in (blocks spam); anonymous rows carry no identity.
create policy "answers_insert" on public.answers for insert to authenticated
  with check (
    (is_anonymous and author_id is null)
    or (not is_anonymous and author_id = auth.uid())
  );
-- only KC reads the raw table (sees everything, incl. who for non-anonymous).
create policy "answers_admin_all" on public.answers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- inquiries: member-asked questions (the "ask a question" box). Same anonymity.
create table public.inquiries (
  id            bigint generated always as identity primary key,
  lesson_id     bigint references public.lessons (id) on delete set null,
  body          text not null,
  is_anonymous  boolean not null default false,
  author_id     uuid references auth.users (id) on delete set null,
  answer        text,
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);
alter table public.inquiries enable row level security;
create policy "inquiries_insert" on public.inquiries for insert to authenticated
  with check (
    (is_anonymous and author_id is null)
    or (not is_anonymous and author_id = auth.uid())
  );
create policy "inquiries_admin_all" on public.inquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Safe views for class members: only published rows, never author_id.
create view public.shared_answers as
  select id, question_id, body, share_pref, created_at
  from public.answers where published = true;
grant select on public.shared_answers to authenticated, anon;

create view public.shared_inquiries as
  select id, lesson_id, body, answer, created_at
  from public.inquiries where published = true and answer is not null;
grant select on public.shared_inquiries to authenticated, anon;

-- ---------------------------------------------------------------------------
insert into public.lessons (cfm_week, title, week_start, week_end) values
  (1, 'Introduction to the Old Testament', '2025-12-29', '2026-01-04'),
  (2, 'Moses 1; Abraham 3', '2026-01-05', '2026-01-11'),
  (3, 'Genesis 1–2; Moses 2–3; Abraham 4–5', '2026-01-12', '2026-01-18'),
  (4, 'Genesis 3–4; Moses 4–5', '2026-01-19', '2026-01-25'),
  (5, 'Genesis 5; Moses 6', '2026-01-26', '2026-02-01'),
  (6, 'Moses 7', '2026-02-02', '2026-02-08'),
  (7, 'Genesis 6–11; Moses 8', '2026-02-09', '2026-02-15'),
  (8, 'Genesis 12–17; Abraham 1–2', '2026-02-16', '2026-02-22'),
  (9, 'Genesis 18–23', '2026-02-23', '2026-03-01'),
  (10, 'Genesis 24–33', '2026-03-02', '2026-03-08'),
  (11, 'Genesis 37–41', '2026-03-09', '2026-03-15'),
  (12, 'Genesis 42–50', '2026-03-16', '2026-03-22'),
  (13, 'Exodus 1–6', '2026-03-23', '2026-03-29'),
  (14, 'Easter', '2026-03-30', '2026-04-05'),
  (15, 'Exodus 7–13', '2026-04-06', '2026-04-12'),
  (16, 'Exodus 14–18', '2026-04-13', '2026-04-19'),
  (17, 'Exodus 19–20; 24; 31–34', '2026-04-20', '2026-04-26'),
  (18, 'Exodus 35–40; Leviticus 1; 4; 16; 19', '2026-04-27', '2026-05-03'),
  (19, 'Numbers 11–14; 20–24; 27', '2026-05-04', '2026-05-10'),
  (20, 'Deuteronomy 6–8; 15; 18; 29–30; 34', '2026-05-11', '2026-05-17'),
  (21, 'Joshua 1–8; 23–24', '2026-05-18', '2026-05-24'),
  (22, 'Judges 2–4; 6–8; 13–16', '2026-05-25', '2026-05-31'),
  (23, 'Ruth; 1 Samuel 1–7', '2026-06-01', '2026-06-07'),
  (24, '1 Samuel 8–10; 13; 15–16', '2026-06-08', '2026-06-14'),
  (25, '1 Samuel 17–18; 24–26; 2 Samuel 5–7', '2026-06-15', '2026-06-21'),
  (26, '2 Samuel 11–12; 1 Kings 3; 6–9; 11', '2026-06-22', '2026-06-28'),
  (27, '1 Kings 12–13; 17–22', '2026-06-29', '2026-07-05'),
  (28, '2 Kings 2–7', '2026-07-06', '2026-07-12'),
  (29, '2 Kings 16–25', '2026-07-13', '2026-07-19'),
  (30, '2 Chronicles 14–20; 26; 30', '2026-07-20', '2026-07-26'),
  (31, 'Ezra 1; 3–7; Nehemiah 2; 4–6; 8', '2026-07-27', '2026-08-02'),
  (32, 'Esther', '2026-08-03', '2026-08-09'),
  (33, 'Job 1–3; 12–14; 19; 21–24; 38–40; 42', '2026-08-10', '2026-08-16'),
  (34, 'Psalms 1–2; 8; 19–33; 40; 46', '2026-08-17', '2026-08-23'),
  (35, 'Psalms 49–51; 61–66; 69–72; 77–78; 85–86', '2026-08-24', '2026-08-30'),
  (36, 'Psalms 102–103; 110; 116–119; 127–128; 135–139; 146–150', '2026-08-31', '2026-09-06'),
  (37, 'Proverbs 1–4; 15–16; 22; 31; Ecclesiastes 1–3; 11–12', '2026-09-07', '2026-09-13'),
  (38, 'Isaiah 1–12', '2026-09-14', '2026-09-20'),
  (39, 'Isaiah 13–14; 22; 24–30; 35', '2026-09-21', '2026-09-27'),
  (40, 'Isaiah 40–49', '2026-09-28', '2026-10-04'),
  (41, 'Isaiah 50–57', '2026-10-05', '2026-10-11'),
  (42, 'Isaiah 58–66', '2026-10-12', '2026-10-18'),
  (43, 'Jeremiah 1–3; 7; 16–18; 20', '2026-10-19', '2026-10-25'),
  (44, 'Jeremiah 31–33; 36–38; Lamentations 1; 3', '2026-10-26', '2026-11-01'),
  (45, 'Ezekiel 1–3; 33–34; 36–37; 47', '2026-11-02', '2026-11-08'),
  (46, 'Daniel 1–7', '2026-11-09', '2026-11-15'),
  (47, 'Hosea 1–6; 10–14; Joel', '2026-11-16', '2026-11-22'),
  (48, 'Amos; Obadiah; Jonah', '2026-11-23', '2026-11-29'),
  (49, 'Micah; Nahum; Habakkuk; Zephaniah', '2026-11-30', '2026-12-06'),
  (50, 'Haggai 1–2; Zechariah 1–4; 7–14', '2026-12-07', '2026-12-13'),
  (51, 'Malachi', '2026-12-14', '2026-12-20'),
  (52, 'Christmas', '2026-12-21', '2026-12-27')
on conflict (cfm_week) do nothing;

-- Sample questions for the two most recent weeks (edit/delete freely).
insert into public.questions (lesson_id, prompt, sort_order)
select id, q.prompt, q.ord from public.lessons, (values
  (24, 'When has the Lord seen something in you (or someone else) that others missed? (1 Samuel 16:7 — "the Lord looketh on the heart")', 1),
  (24, 'Saul lost the kingdom by not waiting on the Lord (1 Samuel 13). Where is the Lord asking you to wait right now?', 2),
  (25, 'David faced Goliath with the same sling he had always used. What ordinary gift has God made into something more in your life?', 1),
  (25, 'Twice David spared Saul when revenge was easy. Where do you feel invited to extend mercy you do not "have" to?', 2)
) as q(week, prompt, ord)
where public.lessons.cfm_week = q.week;
