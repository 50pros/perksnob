import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Hotel } from "@/lib/types";
import CityHotelGrid from "./CityHotelGrid";

interface CityPageProps {
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
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cityName = deslugify(slug);

  return {
    title: `Marriott Hotels in ${cityName} | PerkSnob`,
    description: `Browse crowdsourced elite perk reports for Marriott Bonvoy hotels in ${cityName}.`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const cityName = deslugify(slug);
  const searchTerm = decodeURIComponent(slug).replace(/-/g, " ");

  const supabase = await createServerSupabase();

  const { data: hotels } = await supabase
    .from("hotels")
    .select("*")
    .ilike("location", `%${searchTerm}%`)
    .eq("status", "approved")
    .order("name");

  const hotelList = (hotels || []) as Hotel[];

  // Compute brand distribution
  const brandCounts: Record<string, number> = {};
  hotelList.forEach((h) => {
    brandCounts[h.brand] = (brandCounts[h.brand] || 0) + 1;
  });
  const brands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);

  // Get perk counts
  const hotelIds = hotelList.map((h) => h.id);
  let perkCounts: Record<string, number> = {};
  if (hotelIds.length > 0) {
    const { data: reports } = await supabase
      .from("perk_reports")
      .select("hotel_id")
      .in("hotel_id", hotelIds);

    (reports || []).forEach((r: { hotel_id: string }) => {
      perkCounts[r.hotel_id] = (perkCounts[r.hotel_id] || 0) + 1;
    });
  }

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
            No hotels found in {cityName}
          </h1>
          <p className="mt-3 text-slate-500">
            We don&apos;t have any Marriott properties listed for this city yet.
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
            Destination
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight sm:text-5xl">
            {cityName}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <span>
              <span className="font-bold text-white">{hotelList.length}</span>{" "}
              {hotelList.length === 1 ? "hotel" : "hotels"}
            </span>
            <span className="text-slate-600">&middot;</span>
            <span>
              <span className="font-bold text-white">{brands.length}</span>{" "}
              {brands.length === 1 ? "brand" : "brands"}
            </span>
          </div>

          {/* Brand tags */}
          <div className="mt-5 flex flex-wrap gap-2">
            {brands.map(([brand, count]) => (
              <span
                key={brand}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white"
              >
                {brand}
                <span className="text-[10px] text-slate-400">{count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hotel grid */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <CityHotelGrid hotels={hotelList} perkCounts={perkCounts} />
      </div>
    </main>
  );
}
