-- Contact form submissions. Captured server-side (service role) so messages are
-- never lost even before transactional email is configured.
begin;

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  message    text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
-- RLS on, NO permissive policy → service-role only (inserted via /api/contact).

commit;
