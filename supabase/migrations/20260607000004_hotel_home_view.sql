-- Powers the homepage curated rows: per (approved) hotel, its perk score,
-- report count, and the distinct categories guests have reported.
begin;

create or replace view public.hotel_home as
select
  h.id,
  h.slug,
  h.name,
  h.brand,
  h.location,
  h.region,
  h.country,
  h.room_count,
  coalesce(s.perk_score, 0)::int as score,
  coalesce(rc.report_count, 0) as report_count,
  coalesce(rc.categories, array[]::text[]) as categories
from public.hotels h
left join public.hotel_scores s on s.hotel_id = h.id
left join (
  select hotel_id, count(*)::int as report_count, array_agg(distinct category) as categories
  from public.perk_reports
  group by hotel_id
) rc on rc.hotel_id = h.id
where h.status = 'approved';

grant select on public.hotel_home to anon, authenticated;

commit;
