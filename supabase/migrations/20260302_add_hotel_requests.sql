-- Missing hotel request queue
-- Allows authenticated users to request properties not yet in the hotels table.

begin;

create table if not exists public.hotel_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hotel_name text not null,
  brand text,
  city text,
  state text,
  country text,
  marriott_code text,
  marriott_url text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'duplicate')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create index if not exists hotel_requests_created_at_idx
  on public.hotel_requests (created_at desc);

create unique index if not exists hotel_requests_user_hotel_unique
  on public.hotel_requests (
    user_id,
    lower(hotel_name),
    lower(coalesce(city, '')),
    lower(coalesce(country, ''))
  );

alter table public.hotel_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_requests'
      and policyname = 'hotel_requests_insert_own'
  ) then
    create policy hotel_requests_insert_own
      on public.hotel_requests
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_requests'
      and policyname = 'hotel_requests_select_own'
  ) then
    create policy hotel_requests_select_own
      on public.hotel_requests
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

commit;
