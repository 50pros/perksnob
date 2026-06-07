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

export interface HotelPageData {
  hotel: Hotel;
  declared: HotelPerk[];
  community: CommunityPerk[];
  reportCount: number;
  isClaimed: boolean;
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

  return {
    hotel,
    declared: (declaredRes.data ?? []) as HotelPerk[],
    community,
    reportCount: reportsRes.data?.length ?? 0,
    isClaimed: (claimsRes.data?.length ?? 0) > 0,
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
