import type { MetadataRoute } from "next";

const BASE = "https://perksnob.com";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function rest<T>(path: string, query: string, range?: string): Promise<T[]> {
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/${path}?${query}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        ...(range ? { Range: range } : {}),
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs: string[] = [];
  for (let from = 0; from < 12000; from += 1000) {
    const rows = await rest<{ slug: string }>(
      "hotels",
      "select=slug&status=eq.approved&order=slug.asc",
      `${from}-${from + 999}`,
    );
    if (!rows.length) break;
    slugs.push(...rows.map((r) => r.slug).filter(Boolean));
    if (rows.length < 1000) break;
  }
  const brands = await rest<{ brand: string }>("brand_directory", "select=brand");
  const regions = await rest<{ region: string }>("region_directory", "select=region");

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/hotels`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/hiscores`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
  for (const b of brands) {
    entries.push({
      url: `${BASE}/brand/${slugify(b.brand)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  for (const r of regions) {
    if (r.region) {
      entries.push({
        url: `${BASE}/region/${slugify(r.region)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }
  for (const s of slugs) {
    entries.push({
      url: `${BASE}/hotel/${s}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  return entries;
}
