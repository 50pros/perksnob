begin;

create table if not exists public.hotel_representatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  verified boolean not null default false,
  verified_at timestamp with time zone,
  verification_method text check (verification_method in ('email_domain', 'admin_review')),
  created_at timestamp with time zone not null default now()
);

create unique index if not exists hotel_reps_user_hotel_idx
  on public.hotel_representatives (user_id, hotel_id);

create index if not exists hotel_reps_hotel_idx
  on public.hotel_representatives (hotel_id) where verified = true;

alter table public.hotel_representatives enable row level security;

do $$
begin
  -- Reps can read their own claims
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_representatives'
      and policyname = 'hotel_reps_select_own'
  ) then
    create policy hotel_reps_select_own
      on public.hotel_representatives
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  -- Authenticated users can claim a hotel
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_representatives'
      and policyname = 'hotel_reps_insert_own'
  ) then
    create policy hotel_reps_insert_own
      on public.hotel_representatives
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  -- Everyone can check if a hotel has verified reps (for badge display)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_representatives'
      and policyname = 'hotel_reps_public_verified'
  ) then
    create policy hotel_reps_public_verified
      on public.hotel_representatives
      for select
      using (verified = true);
  end if;

  -- Admins can view and update all
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_representatives'
      and policyname = 'hotel_reps_admin_all'
  ) then
    create policy hotel_reps_admin_all
      on public.hotel_representatives
      for all
      using (exists (select 1 from public.app_admins where user_id = auth.uid()));
  end if;
end $$;

commit;
