-- Hotel request email alert metadata
-- Tracks whether admin notification email has been sent for each request.

begin;

alter table public.hotel_requests
  add column if not exists notification_sent_at timestamp with time zone;

alter table public.hotel_requests
  add column if not exists notification_error text;

create index if not exists hotel_requests_notification_sent_idx
  on public.hotel_requests (notification_sent_at);

commit;

