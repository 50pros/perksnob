"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Hotel, PerkReport } from "@/lib/types";
import PerkLikelihoodSummary from "@/components/perk/PerkLikelihoodSummary";

export default function ComparePage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotelA, setHotelA] = useState("");
  const [hotelB, setHotelB] = useState("");
  const [perksA, setPerksA] = useState<PerkReport[]>([]);
  const [perksB, setPerksB] = useState<PerkReport[]>([]);
  const [loadingPerks, setLoadingPerks] = useState(false);
  const [filterText, setFilterText] = useState({ a: "", b: "" });

  // Load all hotels
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("hotels")
        .select("*")
        .eq("status", "approved")
        .order("name");

      setHotels((data || []) as Hotel[]);
      setLoading(false);
    })();
  }, []);

  // Fetch perks when hotel selection changes
  useEffect(() => {
    if (!hotelA && !hotelB) {
      setPerksA([]);
      setPerksB([]);
      return;
    }

    (async () => {
      setLoadingPerks(true);
      const supabase = createClient();

      const [resA, resB] = await Promise.all([
        hotelA
          ? supabase
              .from("perk_reports")
              .select("*")
              .eq("hotel_id", hotelA)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        hotelB
          ? supabase
              .from("perk_reports")
              .select("*")
              .eq("hotel_id", hotelB)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      setPerksA((resA.data || []) as PerkReport[]);
      setPerksB((resB.data || []) as PerkReport[]);
      setLoadingPerks(false);
    })();
  }, [hotelA, hotelB]);

  const hotelAObj = useMemo(
    () => hotels.find((h) => h.id === hotelA),
    [hotels, hotelA]
  );
  const hotelBObj = useMemo(
    () => hotels.find((h) => h.id === hotelB),
    [hotels, hotelB]
  );

  // Searchable filtered hotel options
  const filteredA = useMemo(() => {
    if (!filterText.a) return hotels;
    const q = filterText.a.toLowerCase();
    return hotels.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.brand.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q)
    );
  }, [hotels, filterText.a]);

  const filteredB = useMemo(() => {
    if (!filterText.b) return hotels;
    const q = filterText.b.toLowerCase();
    return hotels.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.brand.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q)
    );
  }, [hotels, filterText.b]);

  const hasSelection = hotelA || hotelB;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          &larr; Back to home
        </a>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight text-slate-900">
          Compare Hotels
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Side-by-side perk likelihood comparison.
        </p>

        {/* Hotel selectors */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-6">
          {/* Hotel A */}
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Hotel A
            </label>
            <input
              type="text"
              placeholder="Search hotels..."
              value={filterText.a}
              onChange={(e) =>
                setFilterText((prev) => ({ ...prev, a: e.target.value }))
              }
              className="mb-1.5 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            <select
              value={hotelA}
              onChange={(e) => setHotelA(e.target.value)}
              disabled={loading}
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            >
              <option value="">Select a hotel...</option>
              {filteredA.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.brand})
                </option>
              ))}
            </select>
          </div>

          {/* Hotel B */}
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Hotel B
            </label>
            <input
              type="text"
              placeholder="Search hotels..."
              value={filterText.b}
              onChange={(e) =>
                setFilterText((prev) => ({ ...prev, b: e.target.value }))
              }
              className="mb-1.5 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            <select
              value={hotelB}
              onChange={(e) => setHotelB(e.target.value)}
              disabled={loading}
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            >
              <option value="">Select a hotel...</option>
              {filteredB.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.brand})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loadingPerks && (
          <div className="mt-8 text-center text-sm text-slate-500">
            Loading perk data...
          </div>
        )}

        {/* Empty state */}
        {!hasSelection && !loadingPerks && (
          <div className="mt-12 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-medium text-slate-700">
              Select two hotels to compare their elite perks
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Choose from the dropdowns above to see a side-by-side likelihood
              comparison.
            </p>
          </div>
        )}

        {/* Comparison columns */}
        {hasSelection && !loadingPerks && (
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:gap-8">
            {/* Column A */}
            <div className="flex-1 min-w-0">
              {hotelAObj ? (
                <>
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-900">
                      {hotelAObj.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {hotelAObj.brand} &middot; {hotelAObj.location}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {perksA.length} perk reports
                    </p>
                  </div>
                  <PerkLikelihoodSummary perks={perksA} />
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                  Select Hotel A
                </div>
              )}
            </div>

            {/* Column B */}
            <div className="flex-1 min-w-0">
              {hotelBObj ? (
                <>
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-900">
                      {hotelBObj.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {hotelBObj.brand} &middot; {hotelBObj.location}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {perksB.length} perk reports
                    </p>
                  </div>
                  <PerkLikelihoodSummary perks={perksB} />
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                  Select Hotel B
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
