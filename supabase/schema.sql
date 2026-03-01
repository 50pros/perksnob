-- ElitePerks Database Schema
-- Paste this entire file into Supabase SQL Editor (left sidebar → SQL Editor → New Query → paste → Run)

-- 1. HOTELS TABLE
create table public.hotels (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  brand text not null,
  location text not null,
  slug text unique not null,
  created_at timestamp with time zone default now()
);

-- 2. PERK REPORTS TABLE (structured submissions)
create table public.perk_reports (
  id uuid default gen_random_uuid() primary key,
  hotel_id uuid references public.hotels(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null default 'Anonymous',
  elite_tier text not null check (elite_tier in ('ambassador', 'titanium', 'platinum', 'gold', 'silver')),
  category text not null check (category in (
    'breakfast', 'lounge', 'drinks', 'upgrade', 'gift',
    'late_checkout', 'spa', 'parking', 'fnb_credit',
    'housekeeping', 'bathroom', 'other',
    'wifi', 'shower', 'security', 'pool', 'staff_service', 'restaurant'
  )),
  description text not null,
  created_at timestamp with time zone default now()
);

-- 3. COMMENTS TABLE (freeform tips)
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  hotel_id uuid references public.hotels(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null default 'Anonymous',
  elite_tier text not null check (elite_tier in ('ambassador', 'titanium', 'platinum', 'gold', 'silver')),
  text text not null,
  created_at timestamp with time zone default now()
);

-- 4. UPVOTES TABLE (users confirm a perk report)
create table public.upvotes (
  id uuid default gen_random_uuid() primary key,
  perk_report_id uuid references public.perk_reports(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(perk_report_id, user_id)
);

-- 5. AGGREGATED PERKS VIEW (the consensus layer)
-- This view groups perk reports by hotel/tier/category and counts confirmations
create or replace view public.aggregated_perks as
select
  pr.hotel_id,
  pr.elite_tier,
  pr.category,
  pr.description as summary,
  count(distinct pr.id) as report_count,
  count(distinct u.id) as upvote_count,
  count(distinct pr.id) + count(distinct u.id) as total_confirmations,
  case
    when count(distinct pr.id) + count(distinct u.id) >= 8 then 'high'
    when count(distinct pr.id) + count(distinct u.id) >= 4 then 'medium'
    else 'low'
  end as confidence,
  max(pr.created_at) as last_reported
from public.perk_reports pr
left join public.upvotes u on u.perk_report_id = pr.id
group by pr.hotel_id, pr.elite_tier, pr.category, pr.description;

-- 6. ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
alter table public.hotels enable row level security;
alter table public.perk_reports enable row level security;
alter table public.comments enable row level security;
alter table public.upvotes enable row level security;

-- Hotels: anyone can read
create policy "Hotels are viewable by everyone"
  on public.hotels for select using (true);

-- Perk reports: anyone can read, authenticated users can insert
create policy "Perk reports are viewable by everyone"
  on public.perk_reports for select using (true);

create policy "Authenticated users can submit perk reports"
  on public.perk_reports for insert
  with check (auth.uid() = user_id);

-- Comments: anyone can read, authenticated users can insert
create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

create policy "Authenticated users can submit comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

-- Upvotes: anyone can read, authenticated users can insert/delete their own
create policy "Upvotes are viewable by everyone"
  on public.upvotes for select using (true);

create policy "Authenticated users can upvote"
  on public.upvotes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own upvotes"
  on public.upvotes for delete
  using (auth.uid() = user_id);

-- 7. SEED DATA (popular Marriott properties to start)
insert into public.hotels (name, brand, location, slug) values
  ('The Westin Kierland Resort & Spa', 'Westin', 'Scottsdale, AZ', 'westin-kierland'),
  ('The Ritz-Carlton, Naples', 'The Ritz-Carlton', 'Naples, FL', 'ritz-carlton-naples'),
  ('W South Beach', 'W Hotels', 'Miami Beach, FL', 'w-south-beach'),
  ('JW Marriott Orlando Grande Lakes', 'JW Marriott', 'Orlando, FL', 'jw-marriott-orlando'),
  ('The St. Regis Aspen Resort', 'St. Regis', 'Aspen, CO', 'st-regis-aspen'),
  ('Sheraton Waikiki', 'Sheraton', 'Honolulu, HI', 'sheraton-waikiki'),
  ('The Ritz-Carlton, Laguna Niguel', 'The Ritz-Carlton', 'Dana Point, CA', 'ritz-carlton-laguna-niguel'),
  ('W Hollywood', 'W Hotels', 'Los Angeles, CA', 'w-hollywood'),
  ('The Westin Maui Resort & Spa', 'Westin', 'Lahaina, HI', 'westin-maui'),
  ('JW Marriott San Antonio Hill Country', 'JW Marriott', 'San Antonio, TX', 'jw-marriott-san-antonio'),
  ('Marriott Marquis Times Square', 'Marriott Hotels', 'New York, NY', 'marriott-marquis-times-square'),
  ('The Ritz-Carlton, Amelia Island', 'The Ritz-Carlton', 'Amelia Island, FL', 'ritz-carlton-amelia-island'),
  ('Sheraton Grand Chicago Riverwalk', 'Sheraton', 'Chicago, IL', 'sheraton-grand-chicago'),
  ('Le Méridien Maldives Resort & Spa', 'Le Méridien', 'Maldives', 'le-meridien-maldives'),
  ('The St. Regis New York', 'St. Regis', 'New York, NY', 'st-regis-new-york'),
  ('Westin Peachtree Plaza', 'Westin', 'Atlanta, GA', 'westin-peachtree-plaza'),
  ('JW Marriott Cancun Resort & Spa', 'JW Marriott', 'Cancún, Mexico', 'jw-marriott-cancun'),
  ('The Ritz-Carlton, Bacara Santa Barbara', 'The Ritz-Carlton', 'Santa Barbara, CA', 'ritz-carlton-bacara'),
  ('Sheraton Maui Resort & Spa', 'Sheraton', 'Lahaina, HI', 'sheraton-maui'),
  ('W Aspen', 'W Hotels', 'Aspen, CO', 'w-aspen'),
  ('Marriott Bonvoy Boundless', 'Marriott Hotels', 'Washington, DC', 'marriott-washington-dc'),
  ('The Luxury Collection, Hotel Bel-Air', 'The Luxury Collection', 'Los Angeles, CA', 'hotel-bel-air'),
  ('Autograph Collection, The Beekman', 'Autograph Collection', 'New York, NY', 'the-beekman-nyc'),
  ('Renaissance Nashville Hotel', 'Renaissance', 'Nashville, TN', 'renaissance-nashville'),
  ('Courtyard by Marriott Waikiki Beach', 'Courtyard', 'Honolulu, HI', 'courtyard-waikiki');
