-- Lesson deck privacy and live-state checks; safe to rerun without leaving fixtures.
begin;
create function pg_temp.assert(ok boolean, description text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', description; end if; raise notice 'PASS: %', description; end $$;
create function pg_temp.denied(query text, description text) returns void language plpgsql as $$
begin
  begin execute query; exception when others then raise notice 'PASS: % (%)', description, sqlerrm; return; end;
  raise exception 'FAIL: % was allowed', description;
end $$;
create function pg_temp.deck(title text, slides integer) returns jsonb language sql as $$
  select jsonb_build_object('title', title, 'subtitle', 'John 10', 'slides', coalesce((
    select jsonb_agg(jsonb_build_object('label', format('%s slide', n), 'html', format('<section>Slide %s</section>', n)) order by n)
    from generate_series(1, slides) n), '[]'::jsonb));
$$;
select pg_temp.assert(not has_table_privilege('anon','public.decks','SELECT'), 'anonymous callers cannot read the deck table');
select pg_temp.assert(not has_table_privilege('anon','public.slides','SELECT'), 'anonymous callers cannot read the slide table');
select pg_temp.assert(not has_table_privilege('authenticated','public.slides','SELECT'), 'signed-in callers cannot read the slide table');
select pg_temp.assert(not has_function_privilege('anon','public.deck_arrive(integer)','EXECUTE'), 'the internal arrive helper is not callable from the browser');

set local role anon;
select set_config('request.jwt.claims','{}',true);
select pg_temp.denied('select public.deck_save(pg_temp.deck(''Sneaky'',1))', 'anonymous visitors cannot create lessons');
select pg_temp.denied('select public.deck_go_live(1)', 'anonymous visitors cannot start a lesson');
select pg_temp.denied('select public.deck_library()', 'anonymous visitors cannot read the lesson library');

set local role authenticated;
select set_config('request.jwt.claims','{"email":"member@example.test"}',true);
select pg_temp.denied('select public.deck_library()', 'non-admin members cannot read the lesson library');
select pg_temp.denied('select public.deck_save(pg_temp.deck(''Members lesson'',1))', 'non-admin members cannot create lessons');

select set_config('request.jwt.claims','{"email":"iamkcerb@gmail.com"}',true);
select set_config('test.deck', public.deck_save(pg_temp.deck('The Good Shepherd', 3))::text, true);
select set_config('test.poll', public.poll_save(null,'What stood out?','','single',array['Voice','Name','Fold'])::text, true);
select set_config('test.slide0', (public.deck_library()->'decks'->0->'slides'->0->>'id'), true),
       set_config('test.slide1', (public.deck_library()->'decks'->0->'slides'->1->>'id'), true);
select public.slide_set_notes(current_setting('test.slide0')::bigint, 'Pause here, secretly');
select public.slide_set_poll(current_setting('test.slide1')::bigint, current_setting('test.poll')::bigint);
select pg_temp.assert(public.deck_list() = '[]'::jsonb, 'unpublished lessons stay off the class list');
select pg_temp.assert(public.deck_slides(current_setting('test.deck')::bigint) is null, 'unpublished lesson slides are not readable');
select pg_temp.assert(public.stage_current() is null, 'nothing is on the screen before a lesson starts');
select pg_temp.denied(format('select public.deck_show(0)'), 'slides cannot be changed with no live lesson');

select public.deck_go_live(current_setting('test.deck')::bigint);
select pg_temp.assert((public.stage_current()->'slide'->>'idx')::int = 0, 'starting a lesson shows the first slide');
select pg_temp.assert((public.stage_current()->>'count')::int = 3, 'the screen knows how many slides there are');
select pg_temp.assert(not (public.stage_current()->'slide' ? 'notes'), 'teacher notes never reach the screen');
select pg_temp.assert(public.stage_current()::text not like '%secretly%', 'teacher notes never reach the screen in any form');
select pg_temp.assert(public.poll_current() is null, 'a slide with no question leaves the phones waiting');
select pg_temp.denied('select public.deck_show(3)', 'cannot skip past the last slide');
select pg_temp.denied('select public.deck_show(-1)', 'cannot step before the first slide');
select pg_temp.denied(format('select public.deck_save(jsonb_set(pg_temp.deck(''Edited'',2),''{id}'',to_jsonb(%s::bigint)))', current_setting('test.deck')), 'a live lesson cannot be re-imported mid-class');
select pg_temp.denied(format('select public.deck_delete(%s)', current_setting('test.deck')), 'a live lesson cannot be deleted mid-class');

select public.deck_show(1);
select pg_temp.assert(public.poll_current()->>'id' = current_setting('test.poll'), 'arriving at a question slide opens its question');
select pg_temp.assert(public.poll_current()->>'status' = 'open', 'the attached question is open for the class');
select public.deck_show(0);
select pg_temp.assert(coalesce(public.poll_current()->>'status','closed') = 'closed', 'moving off a question slide closes its question');
select public.deck_show(1);
select pg_temp.assert(public.poll_current()->>'status' = 'open', 'coming back reopens the question');
select pg_temp.assert(jsonb_array_length(public.poll_current()->'options') = 3, 'reopening keeps the prepared choices');
select public.deck_end_live();
select pg_temp.assert(public.stage_current() is null, 'ending the lesson clears the screen');
select pg_temp.assert(coalesce(public.poll_current()->>'status','closed') = 'closed', 'ending the lesson closes the slide question');

select public.deck_publish(current_setting('test.deck')::bigint, true);
set local role anon;
select set_config('request.jwt.claims','{}',true);
select pg_temp.assert(jsonb_array_length(public.deck_list()) = 1, 'published lessons appear for the class');
select pg_temp.assert(jsonb_array_length(public.deck_slides(current_setting('test.deck')::bigint)->'slides') = 3, 'the class can read a published lesson');
select pg_temp.assert(public.deck_slides(current_setting('test.deck')::bigint)::text not like '%secretly%', 'past lessons never carry teacher notes');
select pg_temp.denied(format('select public.deck_publish(%s,false)', current_setting('test.deck')), 'visitors cannot unpublish a lesson');

set local role authenticated;
select set_config('request.jwt.claims','{"email":"iamkcerb@gmail.com"}',true);
select pg_temp.assert(public.deck_save(jsonb_set(jsonb_set(pg_temp.deck('The Good Shepherd, revised', 3), '{id}', to_jsonb(current_setting('test.deck')::bigint)), '{subtitle}', '"John 10 revised"'::jsonb))::text = current_setting('test.deck'), 're-importing updates the same lesson');
select pg_temp.assert((public.deck_library()->'decks'->0->'slides'->0->>'notes') = 'Pause here, secretly', 're-importing keeps the notes at each position');
select pg_temp.assert((public.deck_library()->'decks'->0->'slides'->1->>'poll_id') = current_setting('test.poll'), 're-importing keeps the attached question at each position');
select pg_temp.assert((public.deck_library()->'decks'->0->'slides'->0->>'html') like '%Slide 1%', 're-importing replaces the slide artwork');
select pg_temp.denied(format('select public.deck_save(jsonb_set(pg_temp.deck(''Too many'',0),''{id}'',to_jsonb(%s::bigint)))', current_setting('test.deck')), 'a lesson with no slides is rejected');
select pg_temp.denied(format('select public.slide_set_poll(%s, 999999)', current_setting('test.slide0')), 'a question that does not exist cannot be attached');
select public.deck_delete(current_setting('test.deck')::bigint);
select pg_temp.assert(public.deck_list() = '[]'::jsonb, 'deleting a lesson removes it from the class list');
reset role;
select 'All lesson deck assertions passed; fixtures rolled back.' as result;
rollback;
