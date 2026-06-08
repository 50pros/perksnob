// PerkSnob hotel outreach campaign sender.
//
// ⚠️  SAFE BY DEFAULT — runs a DRY RUN (prints what it WOULD send, no emails,
//     no DB writes). To actually send you must pass BOTH --send AND have
//     RESEND_API_KEY set. It also de-dupes against the campaign_sends table,
//     so it's resumable and never double-sends.
//
// Usage:
//   node --env-file=.env.local scripts/campaign.mjs                      # dry run, 10 hotels
//   node --env-file=.env.local scripts/campaign.mjs --limit 5            # dry run, 5 hotels
//   node --env-file=.env.local scripts/campaign.mjs --send --limit 50    # REALLY send 50 (needs RESEND_API_KEY)
//
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and to send:
//      RESEND_API_KEY, CAMPAIGN_FROM_EMAIL, CAMPAIGN_REPLY_TO, APP_BASE_URL,
//      CAMPAIGN_PHYSICAL_ADDRESS, CAMPAIGN_UNSUBSCRIBE_URL
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const SEND = args.includes("--send");
const li = args.indexOf("--limit");
const LIMIT = li >= 0 ? parseInt(args[li + 1], 10) : SEND ? 100 : 10;
const ci = args.indexOf("--campaign");
const CAMPAIGN = ci >= 0 ? args[ci + 1] : "launch-2026";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND = process.env.RESEND_API_KEY;
const FROM = process.env.CAMPAIGN_FROM_EMAIL || "PerkSnob <hello@perksnob.com>";
const REPLY_TO = process.env.CAMPAIGN_REPLY_TO || "hello@perksnob.com";
const BASE = process.env.APP_BASE_URL || "https://perksnob.com";
const ADDRESS = process.env.CAMPAIGN_PHYSICAL_ADDRESS || "{{ADD A PHYSICAL MAILING ADDRESS — required by CAN-SPAM}}";
const UNSUB = process.env.CAMPAIGN_UNSUBSCRIBE_URL || "{{ADD AN UNSUBSCRIBE URL}}";

if (!URL || !KEY) { console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const esc = (s) => String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));

function buildEmail(h) {
  const name = esc(h.name);
  const url = `${BASE}/claim/${h.inviteToken}`;
  const subject = `Claim your free PerkSnob profile for ${h.name}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222222;max-width:600px;margin:0;padding:16px">
  <p>Hi friends at the ${name},</p>
  <p>We are pleased to inform you that your hotel property has been listed on PerkSnob, a directory platform for Marriott Bonvoy Elite guests to browse what perks/benefits various hotels provide.</p>
  <p>It is 100% free, volunteer-led, community-led built by the r/Marriott community on Reddit (over 140,000 people).</p>
  <p>Since your listing has been activated by the community due to popular demand, we hope that you will take ~5 minutes to claim and complete the profile. In a nutshell, what perks/elite benefits does your property provide to guests? For example, Ambassador Elites receive 4PM late-checkout, complimentary hot breakfast, etc.</p>
  <p>Here is the link: <a href="${url}">${url}</a> (expires after 14 days)</p>
  <p>Warmly,<br>PerkSnob Community<br><a href="https://www.reddit.com/r/marriott/">r/Marriott</a></p>
  <p style="font-size:13px;color:#777777">PerkSnob is a free community project, not affiliated with or endorsed by Marriott International.<br>This private invitation was prepared for ${name}.<br>${esc(ADDRESS)} &middot; <a href="${esc(UNSUB)}" style="color:#777777">Unsubscribe</a></p>
</div>`;
  const text = `Hi friends at the ${h.name},\n\nWe are pleased to inform you that your hotel property has been listed on PerkSnob, a directory platform for Marriott Bonvoy Elite guests to browse what perks/benefits various hotels provide.\n\nIt is 100% free, volunteer-led, community-led built by the r/Marriott community on Reddit (over 140,000 people).\n\nSince your listing has been activated by the community due to popular demand, we hope that you will take ~5 minutes to claim and complete the profile. In a nutshell, what perks/elite benefits does your property provide to guests? For example, Ambassador Elites receive 4PM late-checkout, complimentary hot breakfast, etc.\n\nHere is the link: ${url} (expires after 14 days)\n\nWarmly,\nPerkSnob Community\nr/Marriott (https://www.reddit.com/r/marriott/)\n\nPerkSnob is a free community project, not affiliated with or endorsed by Marriott International.\nThis private invitation was prepared for ${h.name}.\n${ADDRESS}\nUnsubscribe: ${UNSUB}`;
  return { subject, html, text };
}

// PostgREST caps each response at 1000 rows, so page through the full set.
async function fetchAll(table, columns, withFilters) {
  const PAGE = 1000;
  const out = [];
  for (let from = 0; ; from += PAGE) {
    let q = sb.from(table).select(columns).range(from, from + PAGE - 1);
    if (withFilters) q = withFilters(q);
    const { data, error } = await q;
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

async function getBatch(limit) {
  const contacts = await fetchAll("hotel_contacts", "hotel_id,email", (q) =>
    q.not("email", "is", null).neq("email", ""),
  );
  const done = await fetchAll("campaign_sends", "hotel_id", (q) => q.eq("campaign", CAMPAIGN));
  const sent = new Set(done.map((d) => d.hotel_id));
  const pending = contacts.filter((c) => !sent.has(c.hotel_id)).slice(0, limit);
  if (!pending.length) return { rows: [], totalAddressable: contacts.length, alreadySent: sent.size };
  const emailBy = new Map(pending.map((c) => [c.hotel_id, c.email]));
  const { data: hotels } = await sb
    .from("hotel_home").select("id,slug,name,location,report_count")
    .in("id", pending.map((c) => c.hotel_id));
  let rows = (hotels || []).map((h) => ({ ...h, email: emailBy.get(h.id) }));

  // Ensure a stable per-hotel invite token (create if missing); the tokenized
  // /claim/<token> URL is the email's CTA. Skip hotels already accepted.
  const ids = rows.map((r) => r.id);
  const { data: invites } = await sb
    .from("hotel_invites").select("hotel_id, token, accepted_at").in("hotel_id", ids);
  const invBy = new Map((invites || []).map((i) => [i.hotel_id, i]));
  const missing = rows.filter((r) => !invBy.has(r.id));
  if (missing.length && SEND) {
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: created } = await sb
      .from("hotel_invites")
      .insert(
        missing.map((r) => ({
          hotel_id: r.id,
          email: emailBy.get(r.id),
          expires_at: expiresAt,
        })),
      )
      .select("hotel_id, token, accepted_at");
    for (const i of created || []) invBy.set(i.hotel_id, i);
  }
  // Dry run stays write-free: existing tokens are shown; not-yet-created ones
  // show a placeholder (the real token is minted when you actually --send).
  rows = rows
    .filter((r) => !invBy.get(r.id)?.accepted_at)
    .map((r) => ({
      ...r,
      inviteToken: invBy.get(r.id)?.token || "TOKEN-CREATED-ON-SEND",
    }));

  return { rows, totalAddressable: contacts.length, alreadySent: sent.size };
}

async function sendOne(h) {
  const { subject, html, text } = buildEmail(h);
  if (!SEND) return { status: "dryrun", subject };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: h.email, reply_to: REPLY_TO, subject, html, text }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { status: "failed", error: JSON.stringify(body).slice(0, 300) };
  return { status: "sent", message_id: body.id };
}

async function main() {
  console.log(`\nPerkSnob campaign "${CAMPAIGN}" — ${SEND ? "🔴 LIVE SEND" : "🟢 DRY RUN (no emails sent, no writes)"} — limit ${LIMIT}\n`);
  if (SEND && !RESEND) { console.error("Refusing to send: --send requires RESEND_API_KEY. Aborting."); process.exit(1); }

  const { rows, totalAddressable, alreadySent } = await getBatch(LIMIT);
  console.log(`Addressable hotels: ${totalAddressable} · already sent this campaign: ${alreadySent} · queued this run: ${rows.length}\n`);

  let sent = 0, failed = 0;
  for (const h of rows) {
    const r = await sendOne(h);
    if (!SEND) {
      console.log(`  [dry] ${h.email}  ←  ${h.name}${h.location ? ` (${h.location})` : ""} · ${h.report_count || 0} reports`);
    } else {
      await sb.from("campaign_sends").upsert(
        { campaign: CAMPAIGN, hotel_id: h.id, email: h.email, status: r.status, message_id: r.message_id, error: r.error },
        { onConflict: "campaign,hotel_id" },
      );
      if (r.status === "sent") { sent++; console.log(`  ✓ ${h.email}`); }
      else { failed++; console.log(`  ✗ ${h.email}  ${r.error || ""}`); }
      await new Promise((res) => setTimeout(res, 400)); // ~2.5/sec — gentle on deliverability
    }
  }

  if (SEND) console.log(`\nDone: ${sent} sent, ${failed} failed. Re-run to continue the next batch.`);
  else {
    console.log(`\n🟢 DRY RUN — nothing was sent or logged.`);
    console.log(`Sample of the email each hotel would get is in notes/email-pitch.md.`);
    console.log(`When you're ready (domain verified, address + unsubscribe set), send a small first batch:`);
    console.log(`   node --env-file=.env.local scripts/campaign.mjs --send --limit 25`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
