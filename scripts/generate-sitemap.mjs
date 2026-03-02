import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const supabaseClientPath = path.join(repoRoot, "src", "supabaseClient.js");
const sitemapPath = path.join(repoRoot, "public", "sitemap.xml");

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function parseSupabaseClient(content) {
  const urlMatch = content.match(/supabaseUrl\s*=\s*'([^']+)'/);
  const keyMatch = content.match(/supabaseAnonKey\s*=\s*'([^']+)'/);
  return {
    supabaseUrl: process.env.SUPABASE_URL || urlMatch?.[1] || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || keyMatch?.[1] || "",
  };
}

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cityFromHotel(hotel) {
  if (hotel.city && String(hotel.city).trim()) return String(hotel.city).trim();
  if (!hotel.location) return "";
  return String(hotel.location).split(",")[0].trim();
}

async function fetchApprovedHotels(supabaseUrl, supabaseAnonKey) {
  const trySelects = ["slug,brand,city,location", "slug,brand,location", "slug,brand"];
  let lastError = null;

  for (const selectClause of trySelects) {
    const hotels = [];
    const pageSize = 1000;
    let from = 0;

    try {
      while (true) {
        const to = from + pageSize - 1;
        const url = new URL(`${supabaseUrl}/rest/v1/hotels`);
        url.searchParams.set("select", selectClause);
        url.searchParams.set("status", "eq.approved");
        url.searchParams.set("order", "slug.asc");

        const response = await fetch(url, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Range: `${from}-${to}`,
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Supabase query failed (${selectClause}): ${response.status} ${errorBody || response.statusText}`
          );
        }

        const rows = await response.json();
        if (!Array.isArray(rows) || rows.length === 0) break;
        for (const row of rows) hotels.push(row || {});
        if (rows.length < pageSize) break;
        from += pageSize;
      }

      return hotels;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Supabase query failed for all hotel select variants.");
}

function buildUrlXml(loc, lastmod, changefreq, priority) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

async function main() {
  const supabaseClient = await fs.readFile(supabaseClientPath, "utf8");
  const { supabaseUrl, supabaseAnonKey } = parseSupabaseClient(supabaseClient);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase credentials. Set SUPABASE_URL/SUPABASE_ANON_KEY or ensure src/supabaseClient.js contains them."
    );
  }

  const approvedHotels = await fetchApprovedHotels(supabaseUrl, supabaseAnonKey);
  const hotelSlugs = [...new Set(approvedHotels.map((h) => h?.slug).filter(Boolean))].sort();
  const brandSlugs = [...new Set(approvedHotels.map((h) => toSlug(h?.brand)).filter(Boolean))].sort();
  const citySlugs = [...new Set(approvedHotels.map((h) => toSlug(cityFromHotel(h))).filter(Boolean))].sort();
  const today = new Date().toISOString().slice(0, 10);

  const staticRoutes = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/leaderboard", changefreq: "weekly", priority: "0.7" },
    { path: "/search", changefreq: "weekly", priority: "0.7" },
    { path: "/compare", changefreq: "weekly", priority: "0.6" },
  ];

  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];

  for (const route of staticRoutes) {
    lines.push(
      buildUrlXml(`https://perksnob.com${route.path}`, today, route.changefreq, route.priority)
    );
  }

  for (const slug of brandSlugs) {
    lines.push(
      buildUrlXml(`https://perksnob.com/brand/${slug}`, today, "weekly", "0.7")
    );
  }

  for (const slug of citySlugs) {
    lines.push(
      buildUrlXml(`https://perksnob.com/city/${slug}`, today, "weekly", "0.7")
    );
  }

  for (const slug of hotelSlugs) {
    lines.push(
      buildUrlXml(`https://perksnob.com/hotel/${slug}`, today, "weekly", "0.8")
    );
  }

  lines.push("</urlset>", "");
  await fs.writeFile(sitemapPath, lines.join("\n"), "utf8");

  console.log(`Generated sitemap: ${sitemapPath}`);
  console.log(`Static URLs: ${staticRoutes.length}`);
  console.log(`Brand URLs: ${brandSlugs.length}`);
  console.log(`City URLs: ${citySlugs.length}`);
  console.log(`Hotel URLs: ${hotelSlugs.length}`);
  console.log(`Total URLs: ${staticRoutes.length + brandSlugs.length + citySlugs.length + hotelSlugs.length}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
