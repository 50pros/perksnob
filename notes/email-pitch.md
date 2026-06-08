# PerkSnob — hotel outreach campaign notes

Running notes for the ~9k-hotel email campaign. **Do not send without explicit approval.**
Build/stage only. Real sends are hard-gated behind `CLAIM_EMAILS_ENABLED=true`.

## The list (validated against the live DB)
- **8,412 of 8,982 hotels (94%) have an email on file** — near-total addressability.
- Emails now live in the protected `hotel_contacts` table (off the public API).

## Why a hotel should claim (the pitch)
- **Reach the travelers who matter most.** Bonvoy elites are Marriott's highest-spend, most-repeat guests, and they check PerkSnob before booking.
- **Control your story.** Right now scattered *guest* reports speak for you. Claiming lets you declare exactly what you offer each tier.
- **Your page already exists.** Every property has a live PerkSnob page with guest data. The email drives them to *fix/own* it, not start from zero.
- **It's free** and verified by a one-time link to the email already on file — low friction, no account games.
- **Close the honesty gap in your favor.** If guests under-report a perk you actually give, declaring it + getting confirmations raises your delivery score.
- **Credibility:** 100% free, volunteer-led, from the Marriott Bonvoy / r/marriott community (not a vendor pitch).

## Conversion funnel
Email → `/for-hotels` (claim) → search property → email-verify (link to on-file address) → `/dashboard` → declare perks → public page shows "Verified by the hotel" + delivery rates.

## Subject-line directions (to test)
- "What your elite guests say you offer at {Hotel}"
- "{Hotel}: claim your free PerkSnob profile (2 min)"
- "Bonvoy elites are reading about {Hotel} — is it accurate?"

## Deliverability + compliance (BEFORE any send)
- Send from a **dedicated subdomain** (e.g. `mail.perksnob.com`) with proper **SPF, DKIM, DMARC** — never the root domain.
- **Warm up** the domain/IP; **batch** sends (e.g. a few hundred/day ramping) — never blast 8,412 at once or the domain gets torched.
- **CAN-SPAM:** valid physical mailing address, working **unsubscribe**, no deceptive subject/headers, honor opt-outs promptly.
- Resend is already wired; needs a verified sending domain + `RESEND_API_KEY` + `CLAIM_FROM_EMAIL`.
- Consider a soft first wave to the most-reported / highest-value properties to validate copy + deliverability before scaling.

## Open questions for later
- Personalize each email with that hotel's current guest-reported perks (dynamic, compelling) vs. a generic template?
- Re-engagement loop: notify a claimed hotel when guests dispute a declared perk.

---

# Operational playbook — the campaign is STAGED (you press send)

Everything is built. **No email goes out until you run the sender with `--send`.** The
default run is a dry run that prints what it *would* do and writes nothing.

## What's built
- **`scripts/campaign.mjs`** — the sender. Dry-run by default; `--send` actually mails via
  Resend. Pulls the full 8,412 addressable hotels (paginated), personalizes each email with
  the property name + its current guest-report count, links to a PRIVATE pre-filled
  invitation page (`/claim/<token>` — not the public profile), mints a stable per-hotel
  invite token on `--send`, skips already-accepted hotels, rate-limits (~2.5/sec), logs every send.
- **`campaign_sends` table** — one row per (campaign, hotel). The sender skips anyone already
  logged, so it's **resumable and never double-sends**. Service-role only (not public).
- **Email** — a private invitation: subject `Claim your free PerkSnob profile for {Hotel}`;
  body = free/community framing → "Accept your invitation" CTA (tokenized `/claim/<token>`)
  → CAN-SPAM footer (not-affiliated + address + unsubscribe).
- **Invitation flow** — clicking the link opens `/claim/<token>` (pre-filled hotel card +
  "why claim" panel), they create an account / sign in, and accept → a VERIFIED claim is
  created and they land in the dashboard. Public profiles show NO claim CTA — it's invite-only.

## Before the first real send (the checklist)
1. **Verify a sending domain in Resend** — use a subdomain like `mail.perksnob.com`, add the
   SPF, DKIM, and DMARC records Resend gives you, and wait for "Verified."
2. **Set env** (in `.env.local`, never commit):
   - `RESEND_API_KEY=` (from Resend)
   - `CAMPAIGN_FROM_EMAIL="PerkSnob <hello@mail.perksnob.com>"`
   - `CAMPAIGN_REPLY_TO="hello@perksnob.com"` (a real inbox you watch)
   - `CAMPAIGN_PHYSICAL_ADDRESS="…"` ← **required by law (CAN-SPAM)**; a real mailing address.
   - `CAMPAIGN_UNSUBSCRIBE_URL="…"` ← a working opt-out link (or a mailto: that you honor).
3. **Warm up** — start tiny and ramp: ~25 → 100 → 500/day over a week+, not 8,412 at once,
   or the domain reputation gets torched and everything lands in spam.

## Running it (you do this, when ready)
```bash
# 1) Dry run — see the plan, send nothing (this is the default)
node --env-file=.env.local scripts/campaign.mjs --limit 25

# 2) First real wave — 25 emails (requires RESEND_API_KEY + verified domain)
node --env-file=.env.local scripts/campaign.mjs --send --limit 25

# 3) Keep going in batches — re-run; it auto-skips everyone already emailed
node --env-file=.env.local scripts/campaign.mjs --send --limit 200
```
Check progress anytime:
```sql
select status, count(*) from campaign_sends where campaign='launch-2026' group by status;
```

## Guardrails already in place
- Dry-run default + `--send` required + `RESEND_API_KEY` required → three things must be true
  to mail anything.
- `--limit` caps every run (default 100 on send) so you ramp deliberately.
- De-dup via `campaign_sends` → safe to re-run, safe to Ctrl-C and resume.
- `hotels.email` is blanked on the public API; the list lives only in protected
  `hotel_contacts`, read with the service-role key the sender uses locally.
