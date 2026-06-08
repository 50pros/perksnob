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
  const r = h.report_count || 0;
  const lead =
    r > 0
      ? `Your property already has a profile on PerkSnob, with ${r} guest report${r === 1 ? "" : "s"} from Marriott Bonvoy elites.`
      : `Your property already has a profile on PerkSnob, the free directory Marriott Bonvoy elites use to compare elite benefits.`;
  const subject = `Claim your free PerkSnob profile for ${h.name}`;
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#17150f;line-height:1.55">
  <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#14533b;font-weight:700;margin:0">PerkSnob · invitation</p>
  <h1 style="font-family:Georgia,serif;font-size:24px;margin:10px 0 16px">${name}</h1>
  <p>${lead}</p>
  <p>PerkSnob is a <strong>free, volunteer-led directory</strong> of Marriott Bonvoy elite benefits, built by the r/marriott community. We've set up a profile for your property — and you're invited to claim it.</p>
  <p>Claiming is free and takes about two minutes. Declare the perks you offer each elite tier, earn the verified badge, and show Marriott's most loyal, highest-spend travelers what makes you worth booking.</p>
  <p style="margin:26px 0"><a href="${url}" style="background:#17150f;color:#fbfaf7;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Accept your invitation →</a></p>
  <p style="font-size:13px;color:#6b655b">This is a private invitation link for ${name}. It's free, with no catch.</p>
  <hr style="border:none;border-top:1px solid #e7e2d7;margin:26px 0">
  <p style="font-size:11px;color:#9b958a">PerkSnob is a free community project, not affiliated with or endorsed by Marriott International.<br>${esc(ADDRESS)}<br>Prefer not to hear from us? <a href="${esc(UNSUB)}" style="color:#9b958a">Unsubscribe</a>.</p>
</div>`;
  const text = `${h.name}\n\n${lead}\n\nPerkSnob is a free, volunteer-led directory of Marriott Bonvoy elite benefits from the r/marriott community. We've set up a profile for your property and you're invited to claim it.\n\nAccept your invitation: ${url}\n\nClaiming is free and takes about two minutes. This is a private invitation link for your property.\n\nPerkSnob is not affiliated with Marriott International.\n${ADDRESS}\nUnsubscribe: ${UNSUB}`;
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
    const { data: created } = await sb
      .from("hotel_invites")
      .insert(missing.map((r) => ({ hotel_id: r.id, email: emailBy.get(r.id) })))
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
