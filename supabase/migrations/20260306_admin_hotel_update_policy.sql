-- Allow app admins to edit hotels directly from the admin UI.

begin;

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
        and policyname = 'hotels_admin_update'
    ) then
      create policy hotels_admin_update
        on public.hotels
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
  end if;
end $$;

commit;
