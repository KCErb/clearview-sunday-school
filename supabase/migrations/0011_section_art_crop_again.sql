-- 0011: back to the crop model { src, aspect, area } (react-easy-crop), with a live
-- card preview in Manage. area = croppedArea percentages or null (centered cover).
update public.sessions set section_art = coalesce((
  select jsonb_object_agg(e.key, jsonb_build_object('src', e.value->'src', 'aspect', 1.5, 'area', null))
  from jsonb_each(section_art) as e
), '{}'::jsonb)
where section_art <> '{}'::jsonb;
