-- Stickiness primitives:
-- 1) users can follow hotels
-- 2) users can configure monthly digest preference
-- 3) log table for monthly digest sends

begin;

create table if not exists public.hotel_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  unique (user_id, hotel_id)
);

create index if not exists hotel_follows_user_idx on public.hotel_follows (user_id);
create index if not exists hotel_follows_hotel_idx on public.hotel_follows (hotel_id);

alter table public.hotel_follows enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_follows'
      and policyname = 'hotel_follows_select_own'
  ) then
    create policy hotel_follows_select_own
      on public.hotel_follows
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_follows'
      and policyname = 'hotel_follows_insert_own'
  ) then
    create policy hotel_follows_insert_own
      on public.hotel_follows
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_follows'
      and policyname = 'hotel_follows_delete_own'
  ) then
    create policy hotel_follows_delete_own
      on public.hotel_follows
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.user_notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_digest_enabled boolean not null default true,
  digest_send_day integer not null default 1
    check (digest_send_day between 1 and 28),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.user_notification_prefs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_notification_prefs'
      and policyname = 'user_notification_prefs_select_own'
  ) then
    create policy user_notification_prefs_select_own
      on public.user_notification_prefs
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_notification_prefs'
      and policyname = 'user_notification_prefs_insert_own'
  ) then
    create policy user_notification_prefs_insert_own
      on public.user_notification_prefs
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_notification_prefs'
      and policyname = 'user_notification_prefs_update_own'
  ) then
    create policy user_notification_prefs_update_own
      on public.user_notification_prefs
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.email_digest_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_month date not null,
  email text not null,
  status text not null check (status in ('sent', 'skipped', 'failed')),
  details jsonb,
  created_at timestamp with time zone not null default now(),
  unique (user_id, period_month)
);

create index if not exists email_digest_log_period_idx on public.email_digest_log (period_month desc);

alter table public.email_digest_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'email_digest_log'
      and policyname = 'email_digest_log_select_own'
  ) then
    create policy email_digest_log_select_own
      on public.email_digest_log
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

commit;
