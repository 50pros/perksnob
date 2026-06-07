"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { perkScore } from "@/lib/utils";
import type { Hotel, PerkReport } from "@/lib/types";

interface PerkReportSlice {
  hotel_id: string;
  category: string;
  category_details: Record<string, string | number | null> | null;
  stay_date: string | null;
  created_at: string;
}

interface HotelsData {
  hotels: Hotel[];
  perkCounts: Record<string, number>;
  scores: Record<string, number>;
  hotelPerks: Record<string, PerkReportSlice[]>;
}

export interface UseHotelsReturn {
  hotels: Hotel[];
  perkCounts: Record<string, number>;
  scores: Record<string, number>;
  hotelPerks: Record<string, PerkReportSlice[]>;
  isLoading: boolean;
  error: Error | undefined;
}

/* ------------------------------------------------------------------ */
/*  SWR fetcher — loads all approved hotels + perk report slices       */
/* ------------------------------------------------------------------ */

async function fetchHotelsData(): Promise<HotelsData> {
  const supabase = createClient();

  // 1. Fetch all approved hotels in 1000-row chunks (max 10 iterations)
  let allHotels: Hotel[] = [];
  let from = 0;
  const step = 1000;
  const maxIterations = 10;

  for (let i = 0; i < maxIterations; i++) {
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .eq("status", "approved")
      .order("name")
      .range(from, from + step - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allHotels = allHotels.concat(data as Hotel[]);
    if (data.length < step) break;
    from += step;
  }

  // 2. Fetch perk report slices
  const { data: reports } = await supabase
    .from("perk_reports")
    .select("hotel_id, category, category_details, stay_date, created_at");

  // 3. Compute derived data
  const counts: Record<string, number> = {};
  const cats: Record<string, Set<string>> = {};
  const hotelPerks: Record<string, PerkReportSlice[]> = {};

  (reports || []).forEach((r: PerkReportSlice) => {
    counts[r.hotel_id] = (counts[r.hotel_id] || 0) + 1;

    if (!cats[r.hotel_id]) cats[r.hotel_id] = new Set();
    cats[r.hotel_id].add(r.category);

    if (!hotelPerks[r.hotel_id]) hotelPerks[r.hotel_id] = [];
    hotelPerks[r.hotel_id].push(r);
  });

  const scores: Record<string, number> = {};
  for (const id of Object.keys(counts)) {
    scores[id] = perkScore(counts[id], cats[id]?.size ?? 0);
  }

  return { hotels: allHotels, perkCounts: counts, scores, hotelPerks };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useHotels(): UseHotelsReturn {
  const { data, error, isLoading } = useSWR<HotelsData, Error>(
    "hotels-all",
    fetchHotelsData,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );

  return {
    hotels: data?.hotels ?? [],
    perkCounts: data?.perkCounts ?? {},
    scores: data?.scores ?? {},
    hotelPerks: data?.hotelPerks ?? {},
    isLoading,
    error,
  };
}
