"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CATS } from "@/lib/constants";

interface DashHotel {
  id: string;
  name: string;
  slug: string;
  brand: string;
  location: string;
}
interface PerkState {
  offered: boolean;
  note: string;
  id?: string;
}

export default function DashboardClient({
  hotels,
  userId,
}: {
  hotels: DashHotel[];
  userId: string;
}) {
  const [sb] = useState(() => createClient());
  const [hotelId, setHotelId] = useState(hotels[0]?.id ?? "");
  const [perks, setPerks] = useState<Record<string, PerkState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const hotel = hotels.find((h) => h.id === hotelId);

  useEffect(() => {
    if (!hotelId) return;
    setLoading(true);
    setSavedMsg(null);
    sb.from("hotel_perks")
      .select("id,category,offered,notes")
      .eq("hotel_id", hotelId)
      .eq("elite_tier", "all")
      .then(({ data }) => {
        const m: Record<string, PerkState> = {};
        for (const r of (data ?? []) as {
          id: string;
          category: string;
          offered: boolean;
          notes: string | null;
        }[]) {
          m[r.category] = { offered: r.offered, note: r.notes ?? "", id: r.id };
        }
        setPerks(m);
        setLoading(false);
      });
  }, [hotelId, sb]);

  const toggle = (cat: string) =>
    setPerks((p) => ({
      ...p,
      [cat]: { offered: !p[cat]?.offered, note: p[cat]?.note ?? "", id: p[cat]?.id },
    }));
  const setNote = (cat: string, note: string) =>
    setPerks((p) => ({
      ...p,
      [cat]: { offered: p[cat]?.offered ?? false, note, id: p[cat]?.id },
    }));

  async function save() {
    setSaving(true);
    setSavedMsg(null);
    const entries = Object.entries(perks);
    const rows = entries
      .filter(([, v]) => v.offered)
      .map(([category, v]) => ({
        hotel_id: hotelId,
        elite_tier: "all",
        category,
        offered: true,
        notes: v.note || null,
        source: "hotel",
        declared_by: userId,
      }));
    let error = null;
    if (rows.length) {
      const r = await sb
        .from("hotel_perks")
        .upsert(rows, { onConflict: "hotel_id,elite_tier,category" });
      error = r.error;
    }
    const remove = entries.filter(([, v]) => !v.offered && v.id).map(([c]) => c);
    if (remove.length && !error) {
      await sb
        .from("hotel_perks")
        .delete()
        .eq("hotel_id", hotelId)
        .eq("elite_tier", "all")
        .in("category", remove);
    }
    setSaving(false);
    setSavedMsg(error ? `Error: ${error.message}` : "Saved. Your perks are now live.");
  }

  const offeredCount = Object.values(perks).filter((v) => v.offered).length;

  return (
    <div>
      {hotels.length > 1 && (
        <select
          value={hotelId}
          onChange={(e) => setHotelId(e.target.value)}
          className="mb-6 rounded-lg border border-line bg-paper-raised px-4 py-2.5 text-sm"
        >
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="font-display text-xl font-semibold">{hotel?.name}</p>
          <p className="text-sm text-ink-soft">
            {offeredCount} perk{offeredCount === 1 ? "" : "s"} declared ·{" "}
            <Link
              href={`/hotel/${hotel?.slug}`}
              className="text-accent underline underline-offset-2"
            >
              view public page
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && (
            <span
              className={`text-sm ${savedMsg.startsWith("Error") ? "text-disputed" : "text-delivered"}`}
            >
              {savedMsg}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving || loading}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-sm text-ink-soft">Loading…</p>
      ) : (
        <ul className="mt-2">
          {CATS.filter((c) => c.key !== "other").map((c) => {
            const state = perks[c.key];
            const on = !!state?.offered;
            return (
              <li
                key={c.key}
                className="flex flex-wrap items-center gap-4 border-b border-line py-4"
              >
                <button
                  onClick={() => toggle(c.key)}
                  role="switch"
                  aria-checked={on}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-line"}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`}
                  />
                </button>
                <span className="flex w-44 items-center gap-2">
                  <span aria-hidden>{c.icon}</span>
                  <span className="font-medium">{c.label}</span>
                </span>
                {on && (
                  <input
                    type="text"
                    value={state?.note ?? ""}
                    onChange={(e) => setNote(c.key, e.target.value)}
                    placeholder="Add a detail (e.g. full breakfast in the main restaurant)"
                    className="min-w-[220px] flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
