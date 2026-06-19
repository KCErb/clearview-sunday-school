-- 0006: each teaching session can carry a piece of (public-domain) art.
alter table public.sessions add column if not exists image text;
