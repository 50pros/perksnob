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
