-- RLS verification for live prompts (migrations 0014 + 0015).
--
-- Impersonates a real non-admin member (set local role authenticated + request.jwt.claims)
-- and asserts what they can and cannot do. The FIRST check confirms auth.uid() actually
-- resolves — without it every "blocked" result below would pass vacuously.
--
-- Creates its own fixture session/prompts and deletes them at the end. Safe to re-run.
-- Run it the same way as a migration (Supabase Management API, see README).
--
-- Last run: 20/20 passed. It caught one real bug: the presence heartbeat's upsert was
-- rejected by RLS, which 0015 fixed by moving it to a security-definer RPC.

drop table if exists public.__rls_results;
create table public.__rls_results(seq serial, check_name text, passed boolean, detail text);
grant all on public.__rls_results to authenticated;
grant usage, select on sequence public.__rls_results_seq_seq to authenticated;

do $$
declare
  member1 uuid := 'f47ddf2d-effe-4779-a1fe-be0cb853e50d';
  member2 uuid := '59ad5b86-f486-4f23-b37b-c5d0a3771adc';
  sess bigint; p_draft bigint; p_anon bigint; p_named bigint; o1 bigint; n int;
begin
  insert into public.sessions (title, teach_date, cfm_weeks, is_published, is_live)
    values ('RLS TEST', current_date, '{}', false, false) returning id into sess;
  insert into public.live_prompts (session_id, kind, prompt, attribution, status)
    values (sess,'single','draft prompt','anonymous','draft') returning id into p_draft;
  insert into public.live_prompts (session_id, kind, prompt, attribution, status)
    values (sess,'single','anon prompt','anonymous','open') returning id into p_anon;
  insert into public.live_prompts (session_id, kind, prompt, attribution, status)
    values (sess,'text','named prompt','named','closed') returning id into p_named;
  insert into public.live_options (prompt_id, label, sort_order) values (p_anon,'A',1) returning id into o1;
  insert into public.live_responses (prompt_id, option_id, author_id) values (p_anon, o1, member2);

  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub',member1,'email','rjjensen0099@gmail.com','role','authenticated')::text, true);

  -- 0. impersonation sanity: everything below is meaningless if this fails
  insert into public.__rls_results(check_name,passed,detail)
    values ('impersonation works (auth.uid resolves, not admin)',
            auth.uid() = member1 and public.is_admin() = false,
            'uid='||coalesce(auth.uid()::text,'NULL')||' is_admin='||public.is_admin());

  select count(*) into n from public.sessions where id = sess;
  insert into public.__rls_results(check_name,passed,detail)
    values ('member cannot see unpublished, non-live session', n=0, 'rows='||n);

  select count(*) into n from public.live_prompts where session_id = sess;
  insert into public.__rls_results(check_name,passed,detail)
    values ('member cannot see prompts while session is not live', n=0, 'rows='||n);

  begin
    insert into public.live_responses (prompt_id, option_id, author_id) values (p_anon, o1, null);
    insert into public.__rls_results(check_name,passed,detail) values ('insert blocked when session not live', false, 'INSERT SUCCEEDED');
  exception when insufficient_privilege then
    insert into public.__rls_results(check_name,passed,detail) values ('insert blocked when session not live', true, 'blocked');
  end;

  reset role;
  update public.sessions set is_live = true where id = sess;
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub',member1,'email','rjjensen0099@gmail.com','role','authenticated')::text, true);

  select count(*) into n from public.live_prompts where id = p_draft;
  insert into public.__rls_results(check_name,passed,detail) values ('member cannot see DRAFT prompts', n=0, 'rows='||n);

  select count(*) into n from public.live_prompts where id in (p_anon, p_named);
  insert into public.__rls_results(check_name,passed,detail) values ('member sees open+closed prompts when live', n=2, 'rows='||n);

  begin
    insert into public.live_responses (prompt_id, option_id, author_id) values (p_anon, o1, member1);
    insert into public.__rls_results(check_name,passed,detail) values ('anonymous prompt REJECTS author_id', false, 'INSERT SUCCEEDED — LEAK');
  exception when insufficient_privilege then
    insert into public.__rls_results(check_name,passed,detail) values ('anonymous prompt REJECTS author_id', true, 'blocked');
  end;

  begin
    insert into public.live_responses (prompt_id, option_id, author_id) values (p_anon, o1, null);
    insert into public.__rls_results(check_name,passed,detail) values ('anonymous insert (null author) allowed', true, 'ok');
  exception when others then
    insert into public.__rls_results(check_name,passed,detail) values ('anonymous insert (null author) allowed', false, SQLERRM);
  end;

  begin
    insert into public.live_responses (prompt_id, body, author_id) values (p_named, 'sneaky', member1);
    insert into public.__rls_results(check_name,passed,detail) values ('insert blocked on CLOSED prompt', false, 'INSERT SUCCEEDED');
  exception when insufficient_privilege then
    insert into public.__rls_results(check_name,passed,detail) values ('insert blocked on CLOSED prompt', true, 'blocked');
  end;

  reset role;
  update public.live_prompts set status='closed' where id=p_anon;
  update public.live_prompts set status='open'   where id=p_named;
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub',member1,'email','rjjensen0099@gmail.com','role','authenticated')::text, true);

  begin
    insert into public.live_responses (prompt_id, body, author_id) values (p_named, 'spoof', member2);
    insert into public.__rls_results(check_name,passed,detail) values ('cannot post as another member', false, 'INSERT SUCCEEDED — SPOOF');
  exception when insufficient_privilege then
    insert into public.__rls_results(check_name,passed,detail) values ('cannot post as another member', true, 'blocked');
  end;

  begin
    insert into public.live_responses (prompt_id, body, author_id) values (p_named, 'my own', member1);
    insert into public.__rls_results(check_name,passed,detail) values ('named insert as self allowed', true, 'ok');
  exception when others then
    insert into public.__rls_results(check_name,passed,detail) values ('named insert as self allowed', false, SQLERRM);
  end;

  select count(*) into n from public.live_responses where author_id is distinct from member1;
  insert into public.__rls_results(check_name,passed,detail)
    values ('member reads no one else''s responses (incl. anonymous)', n=0, 'visible foreign rows='||n);

  select count(*) into n from public.live_tallies where prompt_id = p_anon;
  insert into public.__rls_results(check_name,passed,detail) values ('un-revealed tally hidden from class', n=0, 'rows='||n);

  reset role; update public.live_prompts set reveal = true where id = p_anon; set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub',member1,'email','rjjensen0099@gmail.com','role','authenticated')::text, true);
  select count(*) into n from public.live_tallies where prompt_id = p_anon;
  insert into public.__rls_results(check_name,passed,detail) values ('revealed tally visible to class', n=1, 'rows='||n);

  update public.live_prompts set reveal = false where id = p_anon;
  get diagnostics n = ROW_COUNT;
  insert into public.__rls_results(check_name,passed,detail) values ('member cannot modify prompts', n=0, 'rows updated='||n);

  update public.sessions set is_live = true where id = sess;
  get diagnostics n = ROW_COUNT;
  insert into public.__rls_results(check_name,passed,detail) values ('member cannot toggle live mode', n=0, 'rows updated='||n);

  begin
    insert into public.live_presence (user_id) values (member2);
    insert into public.__rls_results(check_name,passed,detail) values ('cannot fake another member''s presence', false, 'INSERT SUCCEEDED');
  exception when insufficient_privilege then
    insert into public.__rls_results(check_name,passed,detail) values ('cannot fake another member''s presence', true, 'blocked');
  end;

  begin
    perform public.live_heartbeat();
    select count(*) into n from public.live_presence where user_id = member1;
    insert into public.__rls_results(check_name,passed,detail) values ('own heartbeat RPC works', true, 'ok');
  exception when others then
    insert into public.__rls_results(check_name,passed,detail) values ('own heartbeat RPC works', false, SQLERRM);
  end;

  begin
    insert into public.live_presence (user_id) values (member1);
    insert into public.__rls_results(check_name,passed,detail) values ('no direct presence writes at all', false, 'INSERT SUCCEEDED');
  exception when insufficient_privilege then
    insert into public.__rls_results(check_name,passed,detail) values ('no direct presence writes at all', true, 'blocked');
  end;

  select count(*) into n from public.live_presence;
  insert into public.__rls_results(check_name,passed,detail) values ('member cannot read presence roster', n=0, 'visible rows='||n);

  reset role;
  delete from public.live_presence where user_id in (member1, member2);
  delete from public.sessions where id = sess;
end $$;

select check_name,
       case when passed then 'PASS' else '*** FAIL ***' end as result,
       detail
from public.__rls_results order by seq;
