-- PerkSnob v3 — new data model: hotel-declared perks + guest verification.
-- ADDITIVE ONLY. Creates new tables/policies; touches no existing data or columns.
-- (Email PII migration off public hotels happens later, in a coordinated cutover.)

begin;

-- Generic updated_at touch trigger ------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) hotel_perks — the authoritative "what this hotel offers" layer ----------
--    source='hotel'      → declared by a verified hotel rep (authoritative)
--    source='community'  → surfaced by guests for a perk the hotel didn't list
--    source='admin'      → seeded/curated by us
create table if not exists public.hotel_perks (
  id           uuid primary key default gen_random_uuid(),
  hotel_id     uuid not null references public.hotels(id) on delete cascade,
  elite_tier   text not null check (elite_tier in ('ambassador','titanium','platinum','gold','silver','all')),
  category     text not null check (category in (
                 'breakfast','lounge','drinks','upgrade','gift','late_checkout','spa',
                 'parking','fnb_credit','housekeeping','bathroom','wifi','shower',
                 'security','pool','staff_service','restaurant','other')),
  offered      boolean not null default true,
  details      jsonb not null default '{}'::jsonb,
  notes        text,
  source       text not null default 'hotel' check (source in ('hotel','community','admin')),
  declared_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (hotel_id, elite_tier, category)
);
create index if not exists hotel_perks_hotel_idx on public.hotel_perks(hotel_id);
create index if not exists hotel_perks_category_idx on public.hotel_perks(category);

-- 2) hotel_claims — who manages a hotel profile + verification state ---------
create table if not exists public.hotel_claims (
  id                  uuid primary key default gen_random_uuid(),
  hotel_id            uuid not null references public.hotels(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  role                text not null default 'manager',
  status              text not null default 'pending' check (status in ('pending','verified','rejected','revoked')),
  verification_method text check (verification_method in ('email_link','admin')),
  verified_at         timestamptz,
  created_at          timestamptz not null default now(),
  unique (hotel_id, user_id)
);
create index if not exists hotel_claims_hotel_idx on public.hotel_claims(hotel_id);
create index if not exists hotel_claims_verified_idx on public.hotel_claims(hotel_id) where status = 'verified';

-- 3) perk_verifications — guests confirm/dispute a declared perk -------------
--    outcome powers the "claimed vs delivered" delivery rate.
create table if not exists public.perk_verifications (
  id            uuid primary key default gen_random_uuid(),
  hotel_perk_id uuid not null references public.hotel_perks(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  outcome       text not null check (outcome in ('received','not_received','partial')),
  elite_tier    text check (elite_tier in ('ambassador','titanium','platinum','gold','silver')),
  stay_date     date,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (hotel_perk_id, user_id)
);
create index if not exists perk_verifications_perk_idx on public.perk_verifications(hotel_perk_id);
create index if not exists perk_verifications_user_idx on public.perk_verifications(user_id);

-- 4) hotel_contacts — PII (email/phone) lives here, OFF the public hotels table
create table if not exists public.hotel_contacts (
  hotel_id   uuid primary key references public.hotels(id) on delete cascade,
  email      text,
  phone      text,
  updated_at timestamptz not null default now()
);

-- 5) hotel_claim_tokens — magic-link tokens emailed to the on-file hotel email
create table if not exists public.hotel_claim_tokens (
  token      uuid primary key default gen_random_uuid(),
  hotel_id   uuid not null references public.hotels(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  email      text not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists hotel_claim_tokens_hotel_idx on public.hotel_claim_tokens(hotel_id);

-- updated_at triggers --------------------------------------------------------
drop trigger if exists set_updated_at on public.hotel_perks;
create trigger set_updated_at before update on public.hotel_perks
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.perk_verifications;
create trigger set_updated_at before update on public.perk_verifications
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.hotel_contacts;
create trigger set_updated_at before update on public.hotel_contacts
  for each row execute function public.set_updated_at();

-- Row Level Security ---------------------------------------------------------
alter table public.hotel_perks         enable row level security;
alter table public.hotel_claims        enable row level security;
alter table public.perk_verifications  enable row level security;
alter table public.hotel_contacts      enable row level security;
alter table public.hotel_claim_tokens  enable row level security;

-- hotel_perks: world-readable (SEO); writable by the verified hotel rep or an admin
drop policy if exists hotel_perks_public_read on public.hotel_perks;
create policy hotel_perks_public_read on public.hotel_perks for select using (true);

drop policy if exists hotel_perks_owner_write on public.hotel_perks;
create policy hotel_perks_owner_write on public.hotel_perks for all to authenticated
  using (
    exists (select 1 from public.hotel_claims c
            where c.hotel_id = hotel_perks.hotel_id and c.user_id = auth.uid() and c.status = 'verified')
    or exists (select 1 from public.app_admins a where a.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.hotel_claims c
            where c.hotel_id = hotel_perks.hotel_id and c.user_id = auth.uid() and c.status = 'verified')
    or exists (select 1 from public.app_admins a where a.user_id = auth.uid())
  );

-- hotel_claims: verified claims are public (badge); users see/insert own; admins manage
drop policy if exists hotel_claims_public_verified on public.hotel_claims;
create policy hotel_claims_public_verified on public.hotel_claims for select using (status = 'verified');

drop policy if exists hotel_claims_select_own on public.hotel_claims;
create policy hotel_claims_select_own on public.hotel_claims for select to authenticated
  using (auth.uid() = user_id or exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

drop policy if exists hotel_claims_insert_own on public.hotel_claims;
create policy hotel_claims_insert_own on public.hotel_claims for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists hotel_claims_admin_update on public.hotel_claims;
create policy hotel_claims_admin_update on public.hotel_claims for update to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

-- perk_verifications: world-readable (delivery stats); users manage their own
drop policy if exists perk_verifications_public_read on public.perk_verifications;
create policy perk_verifications_public_read on public.perk_verifications for select using (true);

drop policy if exists perk_verifications_insert_own on public.perk_verifications;
create policy perk_verifications_insert_own on public.perk_verifications for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists perk_verifications_update_own on public.perk_verifications;
create policy perk_verifications_update_own on public.perk_verifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists perk_verifications_delete_own on public.perk_verifications;
create policy perk_verifications_delete_own on public.perk_verifications for delete to authenticated
  using (auth.uid() = user_id);

-- hotel_contacts: NOT public. Admins may read; service role bypasses RLS for the email flow.
drop policy if exists hotel_contacts_admin_read on public.hotel_contacts;
create policy hotel_contacts_admin_read on public.hotel_contacts for select to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

-- hotel_claim_tokens: NOT public. Service role only (validated server-side).
-- (RLS enabled with no permissive policy → no anon/authenticated access.)

commit;
