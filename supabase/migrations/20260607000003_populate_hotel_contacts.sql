-- Stage PII off the public hotels table: copy emails/phones into the protected
-- hotel_contacts table (admin/service-role read only). This is additive — it
-- does NOT blank hotels.email yet; that destructive cutover happens later, once
-- the app no longer reads the public column.

begin;

insert into public.hotel_contacts (hotel_id, email, phone)
select id, nullif(email, ''), nullif(phone, '')
from public.hotels
where email is not null and email <> ''
on conflict (hotel_id) do update
  set email = excluded.email,
      phone = coalesce(excluded.phone, public.hotel_contacts.phone),
      updated_at = now();

commit;
