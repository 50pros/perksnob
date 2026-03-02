# monthly-digest Edge Function

Sends monthly recap emails to users who enabled digests in `user_notification_prefs`.

## Required env vars

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `DIGEST_FROM_EMAIL` (example: `PerkSnob <digest@perksnob.com>`)

## Optional env vars

- `APP_BASE_URL` (default: `https://perksnob.com`)
- `DIGEST_CRON_SECRET` (if set, incoming requests must include header `x-digest-secret`)

## Deploy

```bash
supabase functions deploy monthly-digest --project-ref xzdpfnyvsgzdiuuamujv
```

## Invoke (manual)

```bash
curl -X POST \
  "https://xzdpfnyvsgzdiuuamujv.functions.supabase.co/monthly-digest" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "x-digest-secret: $DIGEST_CRON_SECRET" \
  -d '{"dryRun":true}'
```

## Request body options

- `dryRun` (`boolean`): if true, no email is sent; logs are written as `skipped`.
- `forceDay` (`number` 1-28): override digest day matching.
- `forceResend` (`boolean`): resend even if `email_digest_log` already has `sent` for this month.
- `userIds` (`string[]`): limit to explicit user IDs.
