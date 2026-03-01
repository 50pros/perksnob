-- PerkSnob constraint expansion
-- Safe to run on existing databases where perk_reports/comments still use
-- the legacy tier/category checks.

begin;

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.perk_reports'::regclass
      and contype = 'c'
      and (
        pg_get_constraintdef(oid) ilike '%elite_tier%'
        or pg_get_constraintdef(oid) ilike '%category%'
      )
  loop
    execute format('alter table public.perk_reports drop constraint if exists %I', c.conname);
  end loop;
end $$;

alter table public.perk_reports
  add constraint perk_reports_elite_tier_check
  check (elite_tier in ('ambassador', 'titanium', 'platinum', 'gold', 'silver')),
  add constraint perk_reports_category_check
  check (category in (
    'breakfast', 'lounge', 'drinks', 'upgrade', 'gift',
    'late_checkout', 'spa', 'parking', 'fnb_credit',
    'housekeeping', 'bathroom', 'other',
    'wifi', 'shower', 'security', 'pool', 'staff_service', 'restaurant'
  ));

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.comments'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%elite_tier%'
  loop
    execute format('alter table public.comments drop constraint if exists %I', c.conname);
  end loop;
end $$;

alter table public.comments
  add constraint comments_elite_tier_check
  check (elite_tier in ('ambassador', 'titanium', 'platinum', 'gold', 'silver'));

commit;
