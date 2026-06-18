-- 0005: teaching SESSIONS replace per-week framing. A session is a Sunday KC
-- teaches; it can span several Come, Follow Me weeks and holds questions tagged
-- 'study' (this week's material) or 'home' (home-centered gospel learning).
-- Re-points questions/inquiries from lessons to sessions. Clears prior test data.

create table if not exists public.sessions (
  id            bigint generated always as identity primary key,
  title         text,
  teach_date    date not null,
  cfm_weeks     integer[] not null default '{}',   -- CFM week numbers this session covers
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);
alter table public.sessions enable row level security;
create policy "sessions_read" on public.sessions for select to authenticated
  using (is_published or public.is_admin());
create policy "sessions_admin" on public.sessions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Clear placeholder/test content, then re-point questions & inquiries to sessions.
drop view if exists public.shared_inquiries;
delete from public.answers;
delete from public.questions;
delete from public.inquiries;

alter table public.questions drop column if exists lesson_id cascade;
alter table public.questions add column if not exists session_id bigint references public.sessions (id) on delete cascade;
alter table public.questions add column if not exists category text not null default 'study' check (category in ('study','home'));
alter table public.questions add column if not exists reference_url text;

alter table public.inquiries drop column if exists lesson_id cascade;
alter table public.inquiries add column if not exists session_id bigint references public.sessions (id) on delete set null;

create view public.shared_inquiries as
  select id, session_id, body, answer, created_at
  from public.inquiries where published = true and answer is not null;
grant select on public.shared_inquiries to authenticated, anon;

-- Seed: this Sunday (June 21 → CFM week 25) published; July 19 (weeks 26–29) staged unpublished.
insert into public.sessions (title, teach_date, cfm_weeks, is_published) values
  ('Sunday, June 21', '2026-06-21', '{25}', true),
  ('Sunday, July 19',  '2026-07-19', '{26,27,28,29}', false);

insert into public.questions (session_id, category, prompt, reference_url, sort_order)
select s.id, v.category, v.prompt, v.reference_url, v.ord
from public.sessions s, (values
  ('study', 'Because of Saul''s selective obedience he lost the Spirit, yet Samuel continually extended mercy — second and third chances. When have you seen the Lord''s mercy extended to you so that you could try again to use your agency wisely?', 'https://www.churchofjesuschrist.org/study/general-conference/2010/10/agency-essential-to-the-plan-of-life.p34,p37?lang=eng#p34', 1),
  ('study', 'David risked his life to prove to Saul that the rumors were false — that he was not trying to kill him. Have you been prompted by the Lord, even at some personal risk, to show love to your enemies?', null, 2),
  ('study', 'You may already know there are some tragic chapters later in David''s story (see 2 Samuel 11). If you could give David some advice after his battle with Goliath, what would you say? How might that advice apply to your life?', null, 3),
  ('home', 'How do you invite those in your home or sphere of influence to join you in study? (Companionship study, family prayer, a text or video about Come, Follow Me or general conference…)', null, 1),
  ('home', 'How do you find the balance between encouraging those you love to engage in these practices and letting the issue rest — letting them choose their own way?', null, 2)
) as v(category, prompt, reference_url, ord)
where s.teach_date = '2026-06-21';
