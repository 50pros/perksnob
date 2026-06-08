import { createClient } from "@supabase/supabase-js";
import { IMPLIED_NEGATIVE_BY_CATEGORY } from "@/lib/constants";
import type {
  Hotel,
  HotelPerk,
  CommunityPerk,
  PerkCategory,
  EliteTier,
} from "@/lib/types";

/**
 * Cookie-less anon client for PUBLIC reads only. Using this (instead of the
 * cookie-bound server client) keeps public pages statically cacheable / ISR.
 * RLS still applies — anon can read hotels, perk_reports, hotel_perks,
 * perk_verifications, and the public directory views.
 */
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

/* Hotel detail ------------------------------------------------------------- */

export async function getHotelBySlug(slug: string): Promise<Hotel | null> {
  const { data } = await sb
    .from("hotels")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Hotel>();
  return data ?? null;
}

function outcomeOf(
  category: PerkCategory,
  details: Record<string, string | number | null> | null,
): "received" | "not_received" {
  if (details?.report_outcome === "not_received") return "not_received";
  const neg = IMPLIED_NEGATIVE_BY_CATEGORY[category];
  if (neg && neg(details)) return "not_received";
  return "received";
}

export interface DeclaredPerkView extends HotelPerk {
  received: number;
  notReceived: number;
  partial: number;
  deliveryRate: number | null;
}

export interface DeliveryScore {
  grade: string;
  avgDelivery: number;
  declaredCount: number;
  confirmations: number;
}

function gradeFor(rate: number): string {
  if (rate >= 0.9) return "A+";
  if (rate >= 0.8) return "A";
  if (rate >= 0.7) return "B+";
  if (rate >= 0.6) return "B";
  if (rate >= 0.5) return "C";
  if (rate >= 0.35) return "D";
  return "F";
}

export interface HotelPageData {
  hotel: Hotel;
  declared: DeclaredPerkView[];
  community: CommunityPerk[];
  reportCount: number;
  isClaimed: boolean;
  deliveryScore: DeliveryScore | null;
}

export async function getHotelPageData(
  slug: string,
): Promise<HotelPageData | null> {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return null;

  const [reportsRes, declaredRes, claimsRes] = await Promise.all([
    sb
      .from("perk_reports")
      .select("category, elite_tier, description, category_details")
      .eq("hotel_id", hotel.id),
    sb.from("hotel_perks").select("*").eq("hotel_id", hotel.id),
    sb
      .from("hotel_claims")
      .select("id")
      .eq("hotel_id", hotel.id)
      .eq("status", "verified")
      .limit(1),
  ]);

  type Row = {
    category: PerkCategory;
    elite_tier: EliteTier;
    description: string | null;
    category_details: Record<string, string | number | null> | null;
  };

  const byCat = new Map<PerkCategory, CommunityPerk>();
  for (const r of (reportsRes.data ?? []) as Row[]) {
    let c = byCat.get(r.category);
    if (!c) {
      c = {
        category: r.category,
        reports: 0,
        tiers: [],
        received: 0,
        notReceived: 0,
        deliveryRate: null,
        sample: null,
      };
      byCat.set(r.category, c);
    }
    c.reports += 1;
    if (r.elite_tier && !c.tiers.includes(r.elite_tier)) c.tiers.push(r.elite_tier);
    if (outcomeOf(r.category, r.category_details) === "received") c.received += 1;
    else c.notReceived += 1;
    if (!c.sample && r.description) c.sample = r.description;
  }

  const community = [...byCat.values()]
    .map((c) => ({
      ...c,
      deliveryRate:
        c.received + c.notReceived > 0
          ? c.received / (c.received + c.notReceived)
          : null,
    }))
    .sort((a, b) => b.reports - a.reports);

  const declaredRows = (declaredRes.data ?? []) as HotelPerk[];
  const declaredIds = declaredRows.map((d) => d.id);
  const vmap = new Map<
    string,
    { received: number; notReceived: number; partial: number }
  >();
  if (declaredIds.length > 0) {
    const { data: vers } = await sb
      .from("perk_verifications")
      .select("hotel_perk_id, outcome")
      .in("hotel_perk_id", declaredIds);
    for (const v of (vers ?? []) as {
      hotel_perk_id: string;
      outcome: string;
    }[]) {
      let s = vmap.get(v.hotel_perk_id);
      if (!s) {
        s = { received: 0, notReceived: 0, partial: 0 };
        vmap.set(v.hotel_perk_id, s);
      }
      if (v.outcome === "received") s.received += 1;
      else if (v.outcome === "not_received") s.notReceived += 1;
      else s.partial += 1;
    }
  }
  const declared: DeclaredPerkView[] = declaredRows.map((d) => {
    const s = vmap.get(d.id) ?? { received: 0, notReceived: 0, partial: 0 };
    const denom = s.received + s.notReceived;
    return { ...d, ...s, deliveryRate: denom > 0 ? s.received / denom : null };
  });

  // Per-hotel delivery score: weighted average of declared perks' delivery
  // rates, graded A+…F. Needs a minimum sample so a single vote can't set it.
  const offeredRated = declared.filter((d) => d.offered && d.deliveryRate !== null);
  const confirmations = offeredRated.reduce((s, d) => s + d.received + d.notReceived, 0);
  let deliveryScore: DeliveryScore | null = null;
  if (offeredRated.length > 0 && confirmations >= 5) {
    const avg =
      offeredRated.reduce(
        (s, d) => s + (d.deliveryRate ?? 0) * (d.received + d.notReceived),
        0,
      ) / confirmations;
    deliveryScore = {
      grade: gradeFor(avg),
      avgDelivery: avg,
      declaredCount: declared.filter((d) => d.offered).length,
      confirmations,
    };
  }

  return {
    hotel,
    declared,
    community,
    reportCount: reportsRes.data?.length ?? 0,
    isClaimed: (claimsRes.data?.length ?? 0) > 0,
    deliveryScore,
  };
}

/* Directory / browse ------------------------------------------------------- */

export interface DirectoryHotel {
  slug: string;
  name: string;
  brand: string;
  location: string;
  region: string | null;
  country: string | null;
  report_count: number;
}

export async function getTopHotels(limit = 24): Promise<DirectoryHotel[]> {
  const { data } = await sb
    .from("hotel_directory")
    .select("slug,name,brand,location,region,country,report_count")
    .order("report_count", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit);
  return (data ?? []) as DirectoryHotel[];
}

export async function getBrandDirectory(): Promise<
  { brand: string; hotel_count: number }[]
> {
  const { data } = await sb
    .from("brand_directory")
    .select("brand,hotel_count");
  return (data ?? []) as { brand: string; hotel_count: number }[];
}

export async function getRegionDirectory(): Promise<
  { region: string; hotel_count: number }[]
> {
  const { data } = await sb
    .from("region_directory")
    .select("region,hotel_count");
  return (data ?? []) as { region: string; hotel_count: number }[];
}

/** Site-wide counts for the homepage stats bar. Uses head + exact count so it
 *  is NEVER capped by PostgREST's 1000-row response limit (the old site showed
 *  a stuck "1,000" for this reason). */
export async function getHomeStats(): Promise<{ hotels: number; reports: number }> {
  const [h, r] = await Promise.all([
    sb.from("hotels").select("*", { count: "exact", head: true }),
    sb.from("perk_reports").select("*", { count: "exact", head: true }),
  ]);
  return { hotels: h.count ?? 0, reports: r.count ?? 0 };
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export interface HotelList {
  label: string;
  count: number;
  hotels: DirectoryHotel[];
}

export async function getHotelsByBrand(brandSlug: string): Promise<HotelList | null> {
  const brands = await getBrandDirectory();
  const match = brands.find((b) => slugify(b.brand) === brandSlug);
  if (!match) return null;
  const { data } = await sb
    .from("hotel_directory")
    .select("slug,name,brand,location,region,country,report_count")
    .eq("brand", match.brand)
    .order("report_count", { ascending: false })
    .order("name", { ascending: true })
    .limit(120);
  return {
    label: match.brand,
    count: match.hotel_count,
    hotels: (data ?? []) as DirectoryHotel[],
  };
}

export async function getHotelsByRegion(regionSlug: string): Promise<HotelList | null> {
  const regions = await getRegionDirectory();
  const match = regions.find((r) => slugify(r.region) === regionSlug);
  if (!match) return null;
  const { data } = await sb
    .from("hotel_directory")
    .select("slug,name,brand,location,region,country,report_count")
    .eq("region", match.region)
    .order("report_count", { ascending: false })
    .order("name", { ascending: true })
    .limit(120);
  return {
    label: match.region,
    count: match.hotel_count,
    hotels: (data ?? []) as DirectoryHotel[],
  };
}

/* Homepage curated rows ---------------------------------------------------- */

export interface HomeHotel {
  slug: string;
  name: string;
  brand: string;
  location: string;
  region: string | null;
  score: number;
  report_count: number;
  categories: string[];
}

export interface HomeRow {
  key: string;
  title: string;
  subtitle: string;
  hotels: HomeHotel[];
}

const LUXURY_BRANDS = new Set([
  "The Ritz-Carlton",
  "St. Regis",
  "W Hotels",
  "EDITION",
  "The Luxury Collection",
  "JW Marriott",
]);

export async function getHomeRows(): Promise<HomeRow[]> {
  const { data } = await sb
    .from("hotel_home")
    .select("slug,name,brand,location,region,score,report_count,categories")
    .gt("report_count", 0)
    .order("score", { ascending: false })
    .order("report_count", { ascending: false })
    .limit(500);
  const hotels = (data ?? []) as HomeHotel[];
  const has = (h: HomeHotel, c: string) => h.categories?.includes(c);
  const take = (arr: HomeHotel[], n = 12) => arr.slice(0, n);

  const rows: HomeRow[] = [
    {
      key: "top",
      title: "Top Rated Properties",
      subtitle: "Highest community perk scores across every brand",
      hotels: take(hotels),
    },
    {
      key: "luxury",
      title: "Best for Ambassador & Titanium Elite",
      subtitle: "Luxury brands — Ritz-Carlton, St. Regis, W, EDITION, JW Marriott",
      hotels: take(hotels.filter((h) => LUXURY_BRANDS.has(h.brand))),
    },
    {
      key: "breakfast",
      title: "Free Breakfast Confirmed",
      subtitle: "Where guests report complimentary elite breakfast",
      hotels: take(hotels.filter((h) => has(h, "breakfast"))),
    },
    {
      key: "lounge",
      title: "Lounge Access Available",
      subtitle: "Properties with an executive lounge reported open",
      hotels: take(hotels.filter((h) => has(h, "lounge"))),
    },
    {
      key: "upgrade",
      title: "Suite Upgrade Friendly",
      subtitle: "Where elite guests have landed room upgrades",
      hotels: take(hotels.filter((h) => has(h, "upgrade"))),
    },
    {
      key: "most",
      title: "Most Reported",
      subtitle: "The properties with the most community activity",
      hotels: take([...hotels].sort((a, b) => b.report_count - a.report_count)),
    },
  ];
  return rows.filter((r) => r.hotels.length >= 3);
}
