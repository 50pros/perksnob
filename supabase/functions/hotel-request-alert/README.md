# hotel-request-alert Edge Function

Sends an email notification when a new hotel request is submitted, so an admin can review and approve/decline from the queue.

## Required env vars

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

## Optional env vars

- `APP_BASE_URL` (default: `https://perksnob.com`)
- `HOTEL_REQUEST_ALERT_TO` (default: `rei+1@llazani.com`)
- `HOTEL_REQUEST_ALERT_FROM` (fallback: `DIGEST_FROM_EMAIL`, then `PerkSnob <digest@perksnob.com>`)

## Deploy

```bash
supabase functions deploy hotel-request-alert --project-ref xzdpfnyvsgzdiuuamujv
```

## Invoke (manual test)

```bash
curl -X POST \
  "https://xzdpfnyvsgzdiuuamujv.functions.supabase.co/hotel-request-alert" \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"<hotel_request_uuid>"}'
```

