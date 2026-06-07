"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { PerkReport, EliteTier, TierDef } from "@/lib/types";
import { getTier } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import PerkCard from "./PerkCard";

interface TierSectionProps {
  tier: EliteTier | TierDef;
  perks: PerkReport[];
  user: any;
  onVote: (perk: PerkReport, value: number) => void;
  onEdit?: (perk: PerkReport) => void;
  onDelete?: (perk: PerkReport) => void;
  defaultOpen?: boolean;
  highlight?: boolean;
}

export default function TierSection({
  tier,
  perks,
  user,
  onVote,
  onEdit,
  onDelete,
  defaultOpen = true,
  highlight = false,
}: TierSectionProps) {
  const t = typeof tier === "string" ? getTier(tier) : tier;
  const [open, setOpen] = useState(defaultOpen);

  // Empty state
  if (!perks?.length) {
    return (
      <div
        className={[
          "mb-3 rounded-lg p-5",
          highlight
            ? "border-2 border-green-300 bg-green-50"
            : "border border-slate-100 bg-slate-50/50",
        ].join(" ")}
      >
        <div
          className="mb-1.5 flex cursor-pointer items-center gap-2"
          onClick={() => setOpen(!open)}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: t.color }}
          />
          <span
            className="text-xs font-bold"
            style={{ color: t.color }}
          >
            {t.label}
          </span>
          {highlight && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
              style={{ backgroundColor: t.color }}
            >
              YOUR TIER
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400">
          No perks reported yet. Be the first to share what you received!
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "mb-3 rounded-lg px-5 py-4",
        highlight
          ? "border-2 border-green-300 bg-green-50"
          : "border border-slate-200 bg-white",
      ].join(" ")}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        className={[
          "flex cursor-pointer select-none items-center gap-2",
          open ? "mb-1 border-b border-slate-200 pb-3" : "",
        ].join(" ")}
      >
        <ChevronRight
          className={[
            "h-3 w-3 text-slate-400 transition-transform",
            open ? "rotate-90" : "",
          ].join(" ")}
        />
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: t.color }}
        />
        <span
          className="text-[13px] font-bold"
          style={{ color: t.color }}
        >
          {t.label}
        </span>
        {highlight && (
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
            style={{ backgroundColor: t.color }}
          >
            YOUR TIER
          </span>
        )}
        <span className="ml-auto text-[10px] text-slate-400">
          {perks.length} perk{perks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Perk list */}
      {open &&
        perks.map((p, i) => (
          <PerkCard
            key={p.id || i}
            perk={p as any}
            user={user}
            onVote={onVote}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}
