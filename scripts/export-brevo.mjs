// Mints an invite token for every hotel with a contact email, then writes a
// Brevo-ready CSV (one row per UNIQUE email — Brevo dedupes by email) to the
// Desktop. For shared emails, keeps the hotel with the most guest reports.
//
// Usage: SUPABASE_ACCESS_TOKEN=... node scripts/export-brevo.mjs
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const REF = "xzdpfnyvsgzdiuuamujv";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("Set SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

async function sql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`SQL ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

console.log("1/3  Minting an invite token for every hotel with a contact email…");
await sql(`insert into hotel_invites (hotel_id, email)
  select hc.hotel_id, hc.email from hotel_contacts hc
  where hc.email is not null and hc.email <> ''
  on conflict (hotel_id) do nothing;`);

console.log("2/3  Fetching deduped export rows…");
const PAGE = 3000;
let offset = 0;
const rows = [];
for (;;) {
  const batch = await sql(`
    select distinct on (lower(hc.email))
      hc.email                                   as email,
      h.name                                     as hotel_name,
      h.location                                 as city,
      h.brand                                    as brand,
      coalesce(h.country,'')                     as country,
      coalesce(rc.cnt,0)                         as report_count,
      'https://perksnob.com/claim/' || hi.token  as claim_url
    from hotel_invites hi
    join hotels h          on h.id = hi.hotel_id
    join hotel_contacts hc on hc.hotel_id = hi.hotel_id
    left join (select hotel_id, count(*) cnt from perk_reports group by hotel_id) rc
      on rc.hotel_id = hi.hotel_id
    where hc.email is not null and hc.email <> ''
    order by lower(hc.email), coalesce(rc.cnt,0) desc, h.name
    limit ${PAGE} offset ${offset};`);
  rows.push(...batch);
  if (batch.length < PAGE) break;
  offset += PAGE;
}

console.log(`3/3  Writing CSV (${rows.length} unique-email contacts)…`);
const COLS = ["EMAIL", "HOTEL_NAME", "CITY", "BRAND", "COUNTRY", "REPORT_COUNT", "CLAIM_URL"];
const KEY = {
  EMAIL: "email",
  HOTEL_NAME: "hotel_name",
  CITY: "city",
  BRAND: "brand",
  COUNTRY: "country",
  REPORT_COUNT: "report_count",
  CLAIM_URL: "claim_url",
};
const esc = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const lines = [COLS.join(",")];
for (const r of rows) lines.push(COLS.map((c) => esc(r[KEY[c]])).join(","));

const out = join(homedir(), "Desktop", "perksnob-hotel-invitations.csv");
writeFileSync(out, lines.join("\r\n") + "\r\n", "utf8");
console.log(`\nDone -> ${out}`);
console.log(`${rows.length} contacts. Columns: ${COLS.join(", ")}`);
