// Run a .sql file (or inline SQL) against the linked Supabase project via the
// Management API — no Docker/psql needed. Token is read from the environment,
// never hard-coded. Usage:
//   SUPABASE_ACCESS_TOKEN=xxx node scripts/sbsql.mjs path/to/file.sql
//   SUPABASE_ACCESS_TOKEN=xxx node scripts/sbsql.mjs --sql "select 1"
import { readFileSync } from "node:fs";

const ref = process.env.SUPABASE_PROJECT_REF || "xzdpfnyvsgzdiuuamujv";
const token = process.env.SUPABASE_ACCESS_TOKEN;
const a = process.argv[2];
const b = process.argv[3];
if (!token || !a) {
  console.error("usage: SUPABASE_ACCESS_TOKEN=.. node scripts/sbsql.mjs <file.sql | --sql \"SQL\">");
  process.exit(1);
}
const sql = a === "--sql" ? b : readFileSync(a, "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
console.log("HTTP", res.status);
console.log(text.length > 4000 ? text.slice(0, 4000) + "\n…(truncated)" : text);
process.exit(res.ok ? 0 : 1);
