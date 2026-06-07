import { MetadataRoute } from "next";

const BASE_URL = "https://perksnob.com";

function toSlug(value: string | null | undefined): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cityFromHotel(hotel: {
  city?: string;
  location?: string;
}): string {
  if (hotel.city && String(hotel.city).trim()) return String(hotel.city).trim();
  if (!hotel.location) return "";
  return String(hotel.location).split(",")[0].trim();
}

interface HotelRow {
  slug?: string;
  brand?: string;
  city?: string;
  location?: string;
}

async function fetchApprovedHotels(): Promise<HotelRow[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Missing Supabase credentials for sitemap generation. Returning empty hotel list."
    );
    return [];
  }

  const trySelects = ["slug,brand,city,location", "slug,brand,location", "slug,brand"];

  for (const selectClause of trySelects) {
    const hotels: HotelRow[] = [];
    const pageSize = 1000;
    let from = 0;

    try {
      while (true) {
        const to = from + pageSize - 1;
        const url = new URL(`${supabaseUrl}/rest/v1/hotels`);
        url.searchParams.set("select", selectClause);
        url.searchParams.set("status", "eq.approved");
        url.searchParams.set("order", "slug.asc");

        const response = await fetch(url.toString(), {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Range: `${from}-${to}`,
          },
          next: { revalidate: 3600 },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Supabase query failed (${selectClause}): ${response.status} ${errorBody || response.statusText}`
          );
        }

        const rows: HotelRow[] = await response.json();
        if (!Array.isArray(rows) || rows.length === 0) break;
        hotels.push(...rows);
        if (rows.length < pageSize) break;
        from += pageSize;
      }

      return hotels;
    } catch {
      // Try next select clause variant
    }
  }

  console.warn("Sitemap: all Supabase query variants failed. Returning empty hotel list.");
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hotels = await fetchApprovedHotels();

  const hotelSlugs = [...new Set(hotels.map((h) => h.slug).filter(Boolean))].sort();
  const brandSlugs = [...new Set(hotels.map((h) => toSlug(h.brand)).filter(Boolean))].sort();
  const citySlugs = [...new Set(hotels.map((h) => toSlug(cityFromHotel(h))).filter(Boolean))].sort();

  const entries: MetadataRoute.Sitemap = [];

  // Static routes
  entries.push(
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }
  );

  // Brand routes
  for (const slug of brandSlugs) {
    entries.push({
      url: `${BASE_URL}/brand/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // City routes
  for (const slug of citySlugs) {
    entries.push({
      url: `${BASE_URL}/city/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Hotel routes
  for (const slug of hotelSlugs) {
    entries.push({
      url: `${BASE_URL}/hotel/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
