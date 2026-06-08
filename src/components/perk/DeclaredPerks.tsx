"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CATS } from "@/lib/constants";
import { Sparkles } from "lucide-react";

interface DPerk {
  id: string;
  category: string;
  elite_tier: string;
  notes: string | null;
  received: number;
  notReceived: number;
  deliveryRate: number | null;
}

const catMeta = (k: string) => CATS.find((c) => c.key === k) ?? { Icon: Sparkles, label: k };

function tone(r: number | null): string {
  if (r === null) return "text-ink-soft";
  if (r >= 0.7) return "text-delivered";
  if (r >= 0.4) return "text-partial";
  return "text-disputed";
}

const TIER_ORDER = ["all", "ambassador", "titanium", "platinum", "gold", "silver"];
const TIER_LABEL: Record<string, string> = {
  all: "All elite members",
  ambassador: "Ambassador Elite",
  titanium: "Titanium Elite",
  platinum: "Platinum Elite",
  gold: "Gold Elite",
  silver: "Silver Elite",
};

export default function DeclaredPerks({
  perks,
  slug,
}: {
  perks: DPerk[];
  slug: string;
}) {
  const { user } = useAuth();
  const [sb] = useState(() => createClient());
  const [stats, setStats] = useState<Record<string, { r: number; n: number }>>(() => {
    const m: Record<string, { r: number; n: number }> = {};
    for (const p of perks) m[p.id] = { r: p.received, n: p.notReceived };
    return m;
  });
  const [mine, setMine] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMine({});
      return;
    }
    let active = true;
    sb.from("perk_verifications")
      .select("hotel_perk_id, outcome")
      .eq("user_id", user.id)
      .in("hotel_perk_id", perks.map((p) => p.id))
      .then(({ data }) => {
        if (!active) return;
        const m: Record<string, string> = {};
        for (const r of (data ?? []) as { hotel_perk_id: string; outcome: string }[]) {
          m[r.hotel_perk_id] = r.outcome;
        }
        setMine(m);
      });
    return () => {
      active = false;
    };
  }, [user, sb, perks]);

  async function vote(perkId: string, outcome: "received" | "not_received") {
    if (!user || busy) return;
    const prev = mine[perkId];
    if (prev === outcome) return;
    setStats((s) => {
      const cur = { ...s[perkId] };
      if (prev === "received") cur.r -= 1;
      if (prev === "not_received") cur.n -= 1;
      if (outcome === "received") cur.r += 1;
      else cur.n += 1;
      return { ...s, [perkId]: cur };
    });
    setMine((m) => ({ ...m, [perkId]: outcome }));
    setBusy(perkId);
    await sb
      .from("perk_verifications")
      .upsert(
        { hotel_perk_id: perkId, user_id: user.id, outcome },
        { onConflict: "hotel_perk_id,user_id" },
      );
    setBusy(null);
  }

  function renderPerk(p: DPerk) {
    const meta = catMeta(p.category);
    const st = stats[p.id] ?? { r: 0, n: 0 };
    const denom = st.r + st.n;
    const rate = denom > 0 ? st.r / denom : null;
    const my = mine[p.id];
    return (
      <li
        key={p.id}
        className="flex flex-wrap items-start justify-between gap-4 border-b border-line py-4"
      >
        <div className="flex items-start gap-3.5">
          <meta.Icon
            className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft"
            aria-hidden
          />
          <div>
            <p className="font-medium">{meta.label}</p>
            {p.notes && <p className="text-sm text-ink-soft">{p.notes}</p>}
            <div className="mt-2 flex items-center gap-2 text-xs">
              {user ? (
                <>
                  <button
                    onClick={() => vote(p.id, "received")}
                    disabled={busy === p.id}
                    className={`rounded-full border px-3 py-1 transition-colors ${my === "received" ? "border-delivered bg-delivered/10 text-delivered" : "border-line text-ink-soft hover:border-ink"}`}
                  >
                    Got it
                  </button>
                  <button
                    onClick={() => vote(p.id, "not_received")}
                    disabled={busy === p.id}
                    className={`rounded-full border px-3 py-1 transition-colors ${my === "not_received" ? "border-disputed bg-disputed/10 text-disputed" : "border-line text-ink-soft hover:border-ink"}`}
                  >
                    Didn&rsquo;t get it
                  </button>
                </>
              ) : (
                <Link
                  href={`/signin?next=/hotel/${slug}`}
                  className="text-accent underline underline-offset-2"
                >
                  Stayed here? Confirm or dispute →
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {rate === null ? (
            <p className="text-xs text-ink-soft">Awaiting guests</p>
          ) : (
            <>
              <p className={`font-display text-xl font-semibold ${tone(rate)}`}>
                {Math.round(rate * 100)}%
              </p>
              <p className="text-xs text-ink-soft">
                {denom} confirm{denom === 1 ? "s" : ""}
              </p>
            </>
          )}
        </div>
      </li>
    );
  }

  const groups = TIER_ORDER.map((t) => ({
    tier: t,
    items: perks.filter((p) => (p.elite_tier || "all") === t),
  })).filter((g) => g.items.length > 0);
  const showHeaders = groups.length > 1;

  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          What the hotel offers
        </h2>
        <span className="rounded-full border border-delivered/40 bg-delivered/10 px-3 py-1 text-xs font-medium text-delivered">
          Declared by the hotel
        </span>
      </div>
      {groups.map((g) => (
        <div key={g.tier} className={showHeaders ? "mt-6" : "mt-1"}>
          {showHeaders && (
            <h3 className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
              {TIER_LABEL[g.tier] ?? g.tier}
            </h3>
          )}
          <ul className={showHeaders ? "mt-1" : ""}>{g.items.map(renderPerk)}</ul>
        </div>
      ))}
    </section>
  );
}
