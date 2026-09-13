create role anon;
create role authenticated;
create schema auth;
create function auth.jwt() returns jsonb language sql stable as $$ select nullif(current_setting('request.jwt.claims',true),'')::jsonb $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select coalesce(auth.jwt() ->> 'email','') = 'iamkcerb@gmail.com' $$;
grant usage on schema public, auth to anon, authenticated;
