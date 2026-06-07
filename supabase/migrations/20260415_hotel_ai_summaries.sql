begin;

create table if not exists public.hotel_ai_summaries (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  summary jsonb not null,
  perk_count_at_generation integer not null,
  generated_at timestamp with time zone not null default now()
);

create unique index if not exists hotel_ai_summaries_hotel_id_idx
  on public.hotel_ai_summaries (hotel_id);

alter table public.hotel_ai_summaries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hotel_ai_summaries'
      and policyname = 'ai_summaries_public_read'
  ) then
    create policy ai_summaries_public_read
      on public.hotel_ai_summaries
      for select
      using (true);
  end if;
end $$;

commit;
