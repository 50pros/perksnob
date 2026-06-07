"use client";

import { useMemo } from "react";
import { CATS, PERK_CATEGORY_DESC } from "@/lib/constants";
import type { PerkReport } from "@/lib/types";
import {
  toTimestamp,
  perkOutcome,
  likelihoodColor,
  likelihoodBg,
  likelihoodLabel,
  timeAgo,
} from "@/lib/utils";

interface PerkLikelihoodSummaryProps {
  perks: PerkReport[];
}

interface LikelihoodRow {
  key: string;
  icon: string;
  label: string;
  yes: number;
  no: number;
  yesW: number;
  noW: number;
  samples: number;
  lastReport: number;
  score: number | null;
  confidence: string;
  description: string;
}

export default function PerkLikelihoodSummary({
  perks,
}: PerkLikelihoodSummaryProps) {
  const rows = useMemo(() => {
    const now = Date.now();
    const byCat: Record<
      string,
      {
        key: string;
        icon: string;
        label: string;
        yes: number;
        no: number;
        yesW: number;
        noW: number;
        samples: number;
        lastReport: number;
      }
    > = {};

    CATS.forEach((c) => {
      byCat[c.key] = {
        ...c,
        yes: 0,
        no: 0,
        yesW: 0,
        noW: 0,
        samples: 0,
        lastReport: 0,
      };
    });

    (perks || []).forEach((p) => {
      const cat = byCat[p.category];
      if (!cat) return;

      const signalTs =
        toTimestamp(p.stay_date || p.created_at) || 0;
      const reportTs = toTimestamp(p.created_at) || 0;
      const ageDays = signalTs
        ? Math.max(0, (now - signalTs) / 86400000)
        : 730;

      // Recency weight
      const recency =
        ageDays <= 180
          ? 1.2
          : ageDays <= 365
            ? 1.0
            : ageDays <= 730
              ? 0.85
              : 0.7;

      // Vote-based boost
      const voteDelta =
        ((p as any).upvotes || 0) - ((p as any).downvotes || 0);
      const voteBoost =
        1 + Math.max(-0.2, Math.min(0.35, voteDelta * 0.03));

      const w = Math.max(0.3, recency * voteBoost);
      const outcome = perkOutcome(p);

      cat.samples += 1;
      cat.lastReport = Math.max(cat.lastReport, reportTs);

      if (outcome === "not_received") {
        cat.no += 1;
        cat.noW += w;
      } else {
        cat.yes += 1;
        cat.yesW += w;
      }
    });

    return CATS.map((c) => {
      const x = byCat[c.key];
      const totalW = x.yesW + x.noW;
      const score = totalW
        ? Math.round((x.yesW / totalW) * 100)
        : null;
      const confidence =
        x.samples >= 8
          ? "High confidence"
          : x.samples >= 4
            ? "Medium confidence"
            : x.samples > 0
              ? "Low confidence"
              : "No data";

      return {
        ...x,
        score,
        confidence,
        description:
          PERK_CATEGORY_DESC[c.key as keyof typeof PERK_CATEGORY_DESC] ||
          "Community reports for this category.",
      } as LikelihoodRow;
    });
  }, [perks]);

  return (
    <div className="mb-5 rounded-[10px] border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 text-base font-bold text-slate-900">
          Perk Likelihood Snapshot
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          0-100 likelihood from UGC
        </span>
      </div>
      <p className="mb-3.5 text-xs text-slate-500">
        100 means reports in this category mostly said &ldquo;received&rdquo;. 0
        means mostly &ldquo;did not receive&rdquo;. Gray means no data yet.
      </p>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2">
        {rows.map((r) => {
          const hasData = r.score !== null;
          const color = hasData ? likelihoodColor(r.score!) : "#94a3b8";
          const bg = hasData ? likelihoodBg(r.score!) : "#f8fafc";
          const dataLine = hasData
            ? `${r.yes} of ${r.samples} reports said received`
            : "No community reports yet";

          return (
            <div
              key={r.key}
              className="rounded-lg border border-slate-200 p-2.5"
              style={{ backgroundColor: bg }}
            >
              {/* Label + score */}
              <div className="mb-1 flex items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                  <span>{r.icon}</span>
                  {r.label}
                </span>
                <span
                  className="text-[11px] font-bold"
                  style={{ color }}
                >
                  {hasData ? `${r.score}` : "\u2014"}
                </span>
              </div>

              {/* Description */}
              <div className="mb-1.5 text-[10px] leading-snug text-slate-500">
                {r.description}
              </div>

              {/* Progress bar */}
              <div className="mb-1.5 h-[7px] overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full transition-[width] duration-300 ease-out"
                  style={{
                    width: hasData ? `${r.score}%` : "0%",
                    background: hasData
                      ? `linear-gradient(90deg, ${color}66, ${color})`
                      : "#cbd5e1",
                  }}
                />
              </div>

              {/* Likelihood label + counts */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">
                  {hasData ? likelihoodLabel(r.score!) : "No reports yet"}
                </span>
                <span className="text-[9px] text-slate-400">
                  {hasData ? `Yes ${r.yes} \u00B7 No ${r.no}` : ""}
                </span>
              </div>

              {/* Data line */}
              <div className="mt-1 text-[9px] text-slate-500">{dataLine}</div>

              {/* Confidence + updated */}
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[9px] text-slate-400">
                  {r.confidence}
                </span>
                <span className="text-[9px] text-slate-400">
                  {r.lastReport
                    ? `Updated ${timeAgo(new Date(r.lastReport).toISOString())}`
                    : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
