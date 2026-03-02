# monthly-digest Edge Function

Sends a monthly recap email with the top community-reported perks across the platform from the last 30 days.

## How selection works

- Pulls `perk_reports` from the last `windowDays` (default 30).
- Groups similar reports by hotel + category + tier + description.
- Scores each grouped item by total community confirmations:
  - `report_count + upvote_count`
- Ranks by confirmations, then recency.
- Sends the top `topCount` items (default 15, clamped to 10-20).
- Applies a small diversity cap (max 2 items per hotel) so one property does not dominate the digest.
- Sends only on the last UTC day of each month (unless forced by request options).

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
- `forceDay` (`number` 1-28): simulate UTC day for testing the month-end guard.
- `forceRun` (`boolean`): bypass month-end guard.
- `forceResend` (`boolean`): resend even if `email_digest_log` already has `sent` for this month.
- `userIds` (`string[]`): limit to explicit user IDs.
- `topCount` (`number`): desired number of digest items (clamped to 10-20, default 15).
- `windowDays` (`number`): lookback window in days (clamped to 7-90, default 30).
