# ElitePerks — Deployment Guide

## You have 3 steps to go live. No coding required.

---

## STEP 1: Set up the database (Supabase)

1. Go to your Supabase dashboard → **eliteperks** project
2. In the left sidebar, click **SQL Editor**
3. Click **New Query**
4. Open the file `supabase/schema.sql` from this project
5. Copy the ENTIRE contents and paste it into the SQL editor
6. Click **Run** (the green play button)
7. You should see "Success" — this creates all your tables and seeds 25 hotels

### Existing database upgrade (required for 5 tiers + 18 categories):
If your project already exists and was created before March 1, 2026:
1. Open `supabase/migrations/20260301_expand_perk_constraints.sql`
2. Paste into Supabase SQL Editor
3. Click **Run**
4. This updates `perk_reports` and `comments` constraints for:
   - Tiers: Ambassador, Titanium, Platinum, Gold, Silver
   - Categories: 18 total (including WiFi, Shower, Security, Pool, Staff Service, Restaurant)

### Optional: enable missing-hotel requests from users
1. Open `supabase/migrations/20260302_add_hotel_requests.sql`
2. Paste into Supabase SQL Editor
3. Click **Run**
4. This creates the `hotel_requests` queue table + RLS policies

### Optional: enable admin review queue for hotel requests
1. Open `supabase/migrations/20260303_admin_hotel_request_review.sql`
2. Paste into Supabase SQL Editor
3. Click **Run**
4. Add at least one admin user id:
   `insert into public.app_admins (user_id) values ('YOUR_AUTH_USER_UUID') on conflict do nothing;`
5. Admins can then use the `/admin/requests` page to approve/reject requests

### Optional: enable admin hotel profile editing
1. Open `supabase/migrations/20260306_admin_hotel_update_policy.sql`
2. Paste into Supabase SQL Editor
3. Click **Run**
4. Admins can then use `/admin/hotels` to edit hotel metadata directly

### Optional: enable email alerts on new hotel requests
1. Open `supabase/migrations/20260305_hotel_request_alerts.sql`
2. Paste into Supabase SQL Editor
3. Click **Run**
4. Set function secrets in Supabase:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `APP_BASE_URL` (optional)
   - `HOTEL_REQUEST_ALERT_TO` (set to `rei+1@llazani.com`)
   - `HOTEL_REQUEST_ALERT_FROM` (optional)
5. Deploy function:
   `supabase functions deploy hotel-request-alert --project-ref xzdpfnyvsgzdiuuamujv`
6. New request submissions will trigger an email with a direct link to `/admin/requests`

### Optional: enable follows + monthly digest data model
1. Open `supabase/migrations/20260304_follow_hotels_and_digest_prefs.sql`
2. Paste into Supabase SQL Editor
3. Click **Run**
4. This enables:
   - users following hotels (`hotel_follows`)
   - monthly digest on/off preferences (`user_notification_prefs`)
   - digest send logs (`email_digest_log`)

### Optional: deploy monthly digest sender (Edge Function)
1. Set function secrets in Supabase:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `DIGEST_FROM_EMAIL`
   - `APP_BASE_URL` (optional)
   - `DIGEST_CRON_SECRET` (recommended)
2. Deploy function:
   `supabase functions deploy monthly-digest --project-ref xzdpfnyvsgzdiuuamujv`
3. Schedule run (Supabase Scheduled Functions):
   - Endpoint: `monthly-digest`
   - Method: `POST`
   - Body: `{}`
   - Header: `x-digest-secret: <your DIGEST_CRON_SECRET>`
   - Recommended cron: daily (function auto-sends only on the last UTC day of month)

### Enable Google sign-in (optional but recommended):
1. In Supabase sidebar → **Authentication** → **Providers**
2. Toggle on **Google**
3. Follow the instructions to add Google OAuth credentials
   (or just use email/password sign-in which works out of the box)

---

## STEP 2: Push to GitHub

### If you've never used GitHub before:

1. Download and install **GitHub Desktop** from https://desktop.github.com
2. Sign in with your GitHub account
3. Click **File → Add Local Repository** or **Create New Repository**
4. Name it `eliteperks`
5. Set the local path to wherever you saved this project folder
6. Click **Create Repository**
7. Click **Publish Repository** (make it public or private, your choice)

### Or if you prefer the command line:

```bash
cd eliteperks
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/eliteperks.git
git push -u origin main
```

### Refresh SEO sitemap from live hotels (recommended before push):
```bash
npm run generate:sitemap
```
This regenerates `public/sitemap.xml` from all approved hotels in Supabase and removes stale URLs.

---

## STEP 3: Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **Add New → Project**
3. Click **Import** next to your `eliteperks` GitHub repo
4. Vercel will auto-detect it's a Vite project — leave defaults
5. Click **Deploy**
6. Wait ~60 seconds — you'll get a live URL like `eliteperks.vercel.app`

### That's it — your site is live! 🎉

---

## IMPORTANT: Update your Supabase key

Before deploying, make sure `src/supabaseClient.js` points to your own
Supabase project URL and publishable anon key from:
Supabase → **Settings** → **API Keys**.

---

## How it works from here

- Every time you push changes to GitHub, Vercel auto-deploys
- Users sign up, submit perks, and the database grows
- The consensus system builds automatically from report counts
- You can manage data directly in Supabase's dashboard (Table Editor)

## Custom domain (optional, ~$10/year)

1. Buy a domain from Namecheap, Google Domains, or Cloudflare
2. In Vercel → your project → Settings → Domains → Add your domain
3. Update DNS records as Vercel instructs

Ideas: `eliteperks.co`, `marriottperks.info`, `hotelperks.app`
