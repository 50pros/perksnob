-- Read-only directory views powering the /hotels browse experience.
-- Aggregate, public data only. Granted to anon + authenticated for fast reads.

begin;

create or replace view public.hotel_directory as
select
  h.id,
  h.slug,
  h.name,
  h.brand,
  h.location,
  h.region,
  h.country,
  coalesce(rc.report_count, 0) as report_count
from public.hotels h
left join (
  select hotel_id, count(*)::int as report_count
  from public.perk_reports
  group by hotel_id
) rc on rc.hotel_id = h.id
where h.status = 'approved';

create or replace view public.brand_directory as
select brand, count(*)::int as hotel_count
from public.hotels
where status = 'approved'
group by brand
order by hotel_count desc;

create or replace view public.region_directory as
select region, count(*)::int as hotel_count
from public.hotels
where status = 'approved' and region is not null and region <> ''
group by region
order by hotel_count desc;

grant select on public.hotel_directory, public.brand_directory, public.region_directory
  to anon, authenticated;

commit;
