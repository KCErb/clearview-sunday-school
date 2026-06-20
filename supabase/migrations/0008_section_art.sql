-- 0008: art is per-section now (home + each CFM week), stored as a JSON map on the
-- session: { "home": "<art-key-or-url>", "25": "<art-key-or-url>", ... }.
alter table public.sessions add column if not exists section_art jsonb not null default '{}'::jsonb;

-- migrate June 21: home gets a gentle Christ image; week 25 keeps the David engraving.
update public.sessions
set section_art = '{"home":"christ-and-child","25":"david-slays-goliath"}'::jsonb
where teach_date = '2026-06-21' and section_art = '{}'::jsonb;
