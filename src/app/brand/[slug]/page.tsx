import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Hotel } from "@/lib/types";
import BrandHotelGrid from "./BrandHotelGrid";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

function deslugify(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brandName = deslugify(slug);

  return {
    title: `${brandName} Hotels | PerkSnob`,
    description: `Browse crowdsourced elite perk reports for ${brandName} properties across the Marriott Bonvoy portfolio.`,
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brandName = deslugify(slug);
  const searchTerm = decodeURIComponent(slug).replace(/-/g, " ");

  const supabase = await createServerSupabase();

  const { data: hotels } = await supabase
    .from("hotels")
    .select("*")
    .ilike("brand", searchTerm)
    .eq("status", "approved")
    .order("name");

  const hotelList = (hotels || []) as Hotel[];

  // Get perk counts
  const hotelIds = hotelList.map((h) => h.id);
  let perkCounts: Record<string, number> = {};
  let categoryCounts: Record<string, Set<string>> = {};

  if (hotelIds.length > 0) {
    const { data: reports } = await supabase
      .from("perk_reports")
      .select("hotel_id, category")
      .in("hotel_id", hotelIds);

    (reports || []).forEach((r: { hotel_id: string; category: string }) => {
      perkCounts[r.hotel_id] = (perkCounts[r.hotel_id] || 0) + 1;
      if (!categoryCounts[r.hotel_id]) categoryCounts[r.hotel_id] = new Set();
      categoryCounts[r.hotel_id].add(r.category);
    });
  }

  // Sort by score desc, then perkCount desc
  const sortedHotels = [...hotelList].sort((a, b) => {
    const countA = perkCounts[a.id] || 0;
    const countB = perkCounts[b.id] || 0;
    const catsA = categoryCounts[a.id]?.size || 0;
    const catsB = categoryCounts[b.id]?.size || 0;
    const scoreA = Math.min(100, countA * 3 + catsA * 8);
    const scoreB = Math.min(100, countB * 3 + catsB * 8);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return countB - countA;
  });

  // Region distribution
  const regionCounts: Record<string, number> = {};
  hotelList.forEach((h) => {
    const region = h.region || h.country || "Unknown";
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });
  const regions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);

  const hotelsWithReports = hotelIds.filter(
    (id) => (perkCounts[id] || 0) > 0
  ).length;

  if (hotelList.length === 0) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
          >
            &larr; Back to home
          </a>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-slate-900">
            No hotels found for {brandName}
          </h1>
          <p className="mt-3 text-slate-500">
            We don&apos;t have any properties listed for this brand yet.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6"
          >
            &larr; Back to home
          </a>
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">
            Brand
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight sm:text-5xl">
            {brandName}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <span>
              <span className="font-bold text-white">
                {sortedHotels.length}
              </span>{" "}
              {sortedHotels.length === 1 ? "hotel" : "hotels"}
            </span>
            <span className="text-slate-600">&middot;</span>
            <span>
              <span className="font-bold text-white">{hotelsWithReports}</span>{" "}
              with reports
            </span>
          </div>

          {/* Region tags */}
          <div className="mt-5 flex flex-wrap gap-2">
            {regions.map(([region, count]) => (
              <span
                key={region}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white"
              >
                {region}
                <span className="text-[10px] text-slate-400">{count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hotel grid */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <BrandHotelGrid
          hotels={sortedHotels}
          perkCounts={perkCounts}
          categoryCounts={Object.fromEntries(
            Object.entries(categoryCounts).map(([k, v]) => [k, v.size])
          )}
        />
      </div>
    </main>
  );
}
