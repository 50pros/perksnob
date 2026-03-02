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
