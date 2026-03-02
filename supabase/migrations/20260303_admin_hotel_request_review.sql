-- Admin moderation support for hotel requests
-- 1) Adds app_admins table
-- 2) Adds admin read/update permissions on hotel_requests
-- 3) Adds optional hotels insert policy for admins

begin;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

alter table public.app_admins enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'app_admins'
      and policyname = 'app_admins_select_self'
  ) then
    create policy app_admins_select_self
      on public.app_admins
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

alter table public.hotel_requests
  add column if not exists hotel_id uuid references public.hotels(id) on delete set null;

create index if not exists hotel_requests_status_idx
  on public.hotel_requests (status);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_requests'
      and policyname = 'hotel_requests_admin_select'
  ) then
    create policy hotel_requests_admin_select
      on public.hotel_requests
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.app_admins a
          where a.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_requests'
      and policyname = 'hotel_requests_admin_update'
  ) then
    create policy hotel_requests_admin_update
      on public.hotel_requests
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.app_admins a
          where a.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.app_admins a
          where a.user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'hotels'
  ) then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'hotels'
        and policyname = 'hotels_admin_insert'
    ) then
      create policy hotels_admin_insert
        on public.hotels
        for insert
        to authenticated
        with check (
          exists (
            select 1
            from public.app_admins a
            where a.user_id = auth.uid()
          )
        );
    end if;
  end if;
end $$;

commit;
