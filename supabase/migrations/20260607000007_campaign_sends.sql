-- Outreach campaign send log — idempotency + reporting for the hotel email
-- campaign. Service-role only (campaign tooling); no public access.
begin;

create table if not exists public.campaign_sends (
  id         uuid primary key default gen_random_uuid(),
  campaign   text not null,
  hotel_id   uuid not null references public.hotels(id) on delete cascade,
  email      text not null,
  status     text not null check (status in ('sent','failed','skipped')),
  message_id text,
  error      text,
  sent_at    timestamptz not null default now(),
  unique (campaign, hotel_id)
);
create index if not exists campaign_sends_campaign_idx on public.campaign_sends(campaign);

alter table public.campaign_sends enable row level security;
-- RLS enabled with NO permissive policy → only the service role can read/write.

commit;
