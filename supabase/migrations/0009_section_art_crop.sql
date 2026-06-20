-- 0009: per-section art becomes a crop config: { src, aspect, area }.
--   src    = art key or URL
--   aspect = width/height of the displayed art (KC chooses square/wide/portrait)
--   area   = react-easy-crop croppedArea {x,y,width,height} in %, or null (centered cover)
update public.sessions
set section_art = coalesce((
  select jsonb_object_agg(
    e.key,
    case when jsonb_typeof(e.value) = 'string'
      then jsonb_build_object('src', e.value, 'aspect', 1.5, 'area', null)
      else e.value end
  )
  from jsonb_each(section_art) as e
), '{}'::jsonb)
where section_art <> '{}'::jsonb;
