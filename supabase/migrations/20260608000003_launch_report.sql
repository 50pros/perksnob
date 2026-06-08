-- One-time launch report: emails a claim summary to the founder ~7 days post-launch.
-- Fully self-contained: pg_cron schedules it, pg_net posts to Brevo, key from Vault.
begin;

create or replace function public.send_launch_report()
returns void
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_key      text;
  v_to       text;
  v_claimed  int;
  v_declared int;
  v_accepted int;
  v_total    int;
  v_body     text;
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets where name = 'brevo_api_key' limit 1;
  select decrypted_secret into v_to
  from vault.decrypted_secrets where name = 'report_recipient' limit 1;

  select count(*) into v_claimed  from public.hotel_claims  where status = 'verified';
  select count(distinct hotel_id) into v_declared from public.hotel_perks where source = 'hotel';
  select count(*) into v_accepted from public.hotel_invites where accepted_at is not null;
  select count(*) into v_total    from public.hotel_invites;

  v_body :=
    'PerkSnob - launch report (7 days in)' || chr(10) || chr(10) ||
    v_claimed  || ' hotels have claimed (verified) their profile.' || chr(10) ||
    v_declared || ' of those have published their perks.' || chr(10) ||
    v_accepted || ' of ' || v_total || ' invitations have been accepted.' || chr(10) || chr(10) ||
    'Live site: https://perksnob.com';

  perform net.http_post(
    url := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object(
      'api-key', v_key,
      'content-type', 'application/json',
      'accept', 'application/json'
    ),
    body := jsonb_build_object(
      'sender', jsonb_build_object('email', 'noreply@perksnob.com', 'name', 'PerkSnob'),
      'to', jsonb_build_array(jsonb_build_object('email', v_to)),
      'subject', 'PerkSnob - 7-day claim report',
      'textContent', v_body
    )
  );

  -- One-time: remove the schedule after it fires (no-op/ignored if not scheduled).
  begin
    perform cron.unschedule('perksnob-launch-report');
  exception when others then null;
  end;
end;
$func$;

commit;
