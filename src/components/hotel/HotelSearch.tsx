"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Hit {
  slug: string;
  name: string;
  brand: string;
  location: string;
}

export default function HotelSearch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const sb = useRef(createClient());

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await sb.current
        .from("hotel_directory")
        .select("slug,name,brand,location")
        .ilike("name", `%${term}%`)
        .order("report_count", { ascending: false })
        .limit(8);
      if (active) {
        setHits((data ?? []) as Hit[]);
        setLoading(false);
      }
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="relative">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search 8,982 properties by name…"
        aria-label="Search hotels"
        className="w-full rounded-xl border border-line bg-paper-raised px-5 py-4 text-base text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-ink"
      />
      {q.trim().length >= 2 && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-line bg-paper-raised shadow-lg">
          {loading && hits.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink-soft">Searching…</p>
          ) : hits.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink-soft">No matches.</p>
          ) : (
            hits.map((h) => (
              <Link
                key={h.slug}
                href={`/hotel/${h.slug}`}
                className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 last:border-b-0 hover:bg-paper"
              >
                <span>
                  <span className="font-medium">{h.name}</span>
                  <span className="ml-2 text-sm text-ink-soft">{h.location}</span>
                </span>
                <span className="shrink-0 text-[11px] font-medium uppercase tracking-eyebrow text-accent">
                  {h.brand}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
