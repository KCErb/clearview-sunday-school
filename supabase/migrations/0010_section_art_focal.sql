-- 0010: per-section art switches from a fixed-aspect crop to a fill (cover) model:
--   { src, focalX, focalY, zoom } — image covers the card, framed by focal point + zoom.
update public.sessions set section_art = coalesce((
  select jsonb_object_agg(e.key, jsonb_build_object(
    'src', e.value->'src',
    'focalX', 50, 'focalY', 50, 'zoom', 1
  ))
  from jsonb_each(section_art) as e
), '{}'::jsonb)
where section_art <> '{}'::jsonb;
