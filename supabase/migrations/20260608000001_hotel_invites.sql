-- Invitation-only claiming: one pre-generated, unguessable token per hotel,
-- emailed in the outreach campaign. No user_id needed until acceptance (unlike
-- hotel_claim_tokens). Possession of the token = authorization to claim.
begin;

create table if not exists public.hotel_invites (
  token       uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null unique references public.hotels(id) on delete cascade,
  email       text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,                              -- null = no expiry (invites are long-lived)
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null
);
create index if not exists hotel_invites_hotel_idx on public.hotel_invites(hotel_id);

alter table public.hotel_invites enable row level security;
-- RLS on, NO permissive policy → service-role only (validated server-side).

commit;
