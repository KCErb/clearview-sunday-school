-- 0013: separate the two consents. is_anonymous already = "not even KC knows".
-- attribution_ok = "OK to show my name (and photo) in class" — opt-in, default false
-- (so existing submissions are never attributed in class without explicit consent).
alter table public.answers add column if not exists attribution_ok boolean not null default false;
alter table public.insights add column if not exists attribution_ok boolean not null default false;
