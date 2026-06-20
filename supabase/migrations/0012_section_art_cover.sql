-- 0012: card art renders as cover-fill (no white bars). Store framing as focal + zoom;
-- the cropper sets these, the card always fills its (links-driven) height.
update public.sessions set section_art = coalesce((
  select jsonb_object_agg(e.key, jsonb_build_object('src', e.value->'src', 'focalX', 50, 'focalY', 50, 'zoom', 1))
  from jsonb_each(section_art) as e
), '{}'::jsonb)
where section_art <> '{}'::jsonb;
