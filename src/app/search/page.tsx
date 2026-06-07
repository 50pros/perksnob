"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TIERS, CATS } from "@/lib/constants";
import type { PerkReport, EliteTier, PerkCategory } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useVote } from "@/hooks/useVote";
import PerkCard from "@/components/perk/PerkCard";
import Button from "@/components/ui/Button";

export default function SearchPage() {
  const [tier, setTier] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<
    (PerkReport & { hotel_name?: string })[]
  >([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const { votes, loadVotes, vote } = useVote(user?.id);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const supabase = createClient();

      let query = supabase
        .from("perk_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (tier) {
        query = query.eq("elite_tier", tier);
      }
      if (category) {
        query = query.eq("category", category);
      }

      const { data: perks, error: perkError } = await query;

      if (perkError) {
        setError("Failed to search perks.");
        setResults([]);
        setLoading(false);
        return;
      }

      const perkList = (perks || []) as PerkReport[];

      // Fetch hotel names for display
      const hotelIds = [...new Set(perkList.map((p) => p.hotel_id))];
      let hotelNames: Record<string, string> = {};

      if (hotelIds.length > 0) {
        const { data: hotels } = await supabase
          .from("hotels")
          .select("id, name")
          .in("id", hotelIds);

        (hotels || []).forEach((h: { id: string; name: string }) => {
          hotelNames[h.id] = h.name;
        });
      }

      const enriched = perkList.map((p) => ({
        ...p,
        hotel_name: hotelNames[p.hotel_id] || "Unknown Hotel",
      }));

      setResults(enriched);

      // Load votes for the results
      if (user && perkList.length > 0) {
        loadVotes(perkList.map((p) => p.id));
      }
    } catch {
      setError("An unexpected error occurred.");
      setResults([]);
    }

    setLoading(false);
  }, [tier, category, user, loadVotes]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          &larr; Back to home
        </a>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight text-slate-900">
          Search Perks
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Filter perk reports by elite tier and category.
        </p>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-auto">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Elite Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900 sm:w-56"
            >
              <option value="">All tiers</option>
              {TIERS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Perk Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900 sm:w-56"
            >
              <option value="">All categories</option>
              {CATS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleSearch} loading={loading} size="lg">
            Search
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="mt-8">
          {searched && results.length === 0 && !loading && !error && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-lg font-medium text-slate-700">
                No perks found matching your filters
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search criteria.
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-5">
              {results.map((perk) => (
                <PerkCard
                  key={perk.id}
                  perk={perk}
                  user={user}
                  userVote={votes[perk.id]}
                  onVote={(p, v) => vote(p.id, v)}
                  showHotel
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
