-- Anti-gaming: a verified hotel rep cannot verify their own property's declared
-- perks (which would let them inflate the hotel's delivery score).
begin;

create or replace function public.prevent_rep_self_verify()
returns trigger language plpgsql security definer as $$
begin
  if exists (
    select 1
    from public.hotel_perks hp
    join public.hotel_claims hc on hc.hotel_id = hp.hotel_id
    where hp.id = new.hotel_perk_id
      and hc.user_id = new.user_id
      and hc.status = 'verified'
  ) then
    raise exception 'Hotel representatives cannot verify their own property''s perks.';
  end if;
  return new;
end;
$$;

drop trigger if exists no_rep_self_verify on public.perk_verifications;
create trigger no_rep_self_verify
  before insert or update on public.perk_verifications
  for each row execute function public.prevent_rep_self_verify();

commit;
