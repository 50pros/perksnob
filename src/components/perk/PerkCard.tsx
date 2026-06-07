"use client";

import { useState } from "react";
import type { PerkReport } from "@/lib/types";
import {
  getCategory,
  getTier,
  formatStayDate,
  perkOutcome,
} from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import CategoryDetailTags from "./CategoryDetailTags";

interface PerkCardProps {
  perk: PerkReport & {
    upvotes?: number;
    downvotes?: number;
    my_vote?: number;
    hotel_name?: string;
    summary?: string;
    latest_stay?: string;
  };
  user: any;
  userVote?: number;
  onVote: (
    perk: PerkReport,
    value: number,
  ) => void;
  onEdit?: (perk: PerkReport) => void;
  onDelete?: (perk: PerkReport) => void;
  onFlag?: (perk: PerkReport, reason: string) => void;
  showHotel?: boolean;
}

export default function PerkCard({
  perk,
  user,
  onVote,
  onEdit,
  onDelete,
  onFlag,
  showHotel = false,
}: PerkCardProps) {
  const cat = getCategory(perk.category);
  const tier = getTier(perk.elite_tier);
  const stay = formatStayDate(perk.stay_date || (perk as any).latest_stay);
  const isOwner = user && perk.user_id === user.id;
  const outcome = perkOutcome(perk);

  const hasPromo =
    perk.promo_code ||
    perk.booking_type === "Employee (MMF, MMP, etc.)" ||
    perk.booking_type === "Employee (MMP)" ||
    perk.booking_type === "Corporate" ||
    perk.booking_type === "3rd Party (e.g. Priceline)";

  const score = (perk.upvotes || 0) - (perk.downvotes || 0);
  const myVote = perk.my_vote || 0;
  const [flagging, setFlagging] = useState(false);

  const submitted = perk.created_at
    ? new Date(perk.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="flex gap-3.5 border-b border-slate-100 py-4">
      {/* Vote column */}
      <div className="flex min-w-[36px] flex-col items-center gap-0.5 pt-0.5">
        {user ? (
          <button
            onClick={() => onVote(perk, myVote === 1 ? 0 : 1)}
            aria-label="Upvote"
            className={`border-none bg-transparent p-0 text-base transition-colors ${
              myVote === 1
                ? "cursor-pointer text-green-600"
                : "cursor-pointer text-slate-300 hover:text-green-500"
            }`}
          >
            &#x25B2;
          </button>
        ) : (
          <span className="text-base text-slate-300">&#x25B2;</span>
        )}

        <span
          className={`text-[13px] font-bold ${
            score > 0
              ? "text-green-600"
              : score < 0
                ? "text-red-600"
                : "text-slate-400"
          }`}
        >
          {score}
        </span>

        {user ? (
          <button
            onClick={() => onVote(perk, myVote === -1 ? 0 : -1)}
            aria-label="Downvote"
            className={`border-none bg-transparent p-0 text-base transition-colors ${
              myVote === -1
                ? "cursor-pointer text-red-600"
                : "cursor-pointer text-slate-300 hover:text-red-500"
            }`}
          >
            &#x25BC;
          </button>
        ) : (
          <span className="text-base text-slate-300">&#x25BC;</span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {showHotel && (
          <div className="mb-1 text-[11px] font-bold text-slate-900">
            {(perk as any).hotel_name}
          </div>
        )}

        {/* Category icon + label */}
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-[15px]">{cat.icon}</span>
          <span className="text-xs font-bold uppercase tracking-wide text-slate-900">
            {cat.label}
          </span>
        </div>

        {/* Meta line: username, stay date, submitted */}
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">
            {perk.display_name}
          </span>
          {stay ? (
            <>
              <span className="text-slate-300">&middot;</span>
              <span>Stayed {stay}</span>
            </>
          ) : (
            <>
              <span className="text-slate-300">&middot;</span>
              <span className="italic text-slate-400">
                Stay date not provided
              </span>
            </>
          )}
          {submitted && (
            <>
              <span className="text-slate-300">&middot;</span>
              <span>Reported {submitted}</span>
            </>
          )}
          {perk.edit_count > 0 && (
            <>
              <span className="text-slate-300">&middot;</span>
              <span
                className="italic text-slate-400"
                title={
                  perk.last_edited_at
                    ? `Last edited ${new Date(perk.last_edited_at).toLocaleDateString()}`
                    : ""
                }
              >
                edited{perk.edit_count > 1 ? ` x${perk.edit_count}` : ""}
              </span>
            </>
          )}
        </div>

        {/* Tags row */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-slate-100"
            style={{ color: tier.color }}
          >
            {tier.label}
          </span>
          <Badge
            variant={outcome === "not_received" ? "error" : "success"}
            className="text-[9px]"
          >
            {outcome === "not_received" ? "Not received" : "Received"}
          </Badge>
          {perk.upgrade_type && (
            <Badge variant="info" className="text-[9px]">
              {perk.upgrade_type}
            </Badge>
          )}
          {perk.booking_type && (
            <Badge variant="success" className="text-[9px]">
              {perk.booking_type}
            </Badge>
          )}
          {hasPromo && (
            <span
              className="inline-flex cursor-help items-center rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800"
              title="Booked with a promo/corporate/employee code -- perks received may differ from standard elite bookings"
            >
              &#x26A0;&#xFE0F; {perk.promo_code || "Promo/Corp rate"}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="text-[13px] leading-relaxed text-slate-600">
          {(perk as any).summary || perk.description}
        </div>

        {/* Category detail tags */}
        <CategoryDetailTags
          category={perk.category}
          details={perk.category_details || {}}
        />

        {/* Actions */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {isOwner && onEdit && (
            <button
              onClick={() => onEdit(perk)}
              aria-label="Edit perk"
              className="rounded border border-blue-200 bg-transparent px-2 py-0.5 text-[10px] font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              Edit
            </button>
          )}
          {isOwner && onDelete && (
            <button
              onClick={() => {
                if (window.confirm("Delete this perk report?")) onDelete(perk);
              }}
              aria-label="Delete perk"
              className="rounded border border-red-200 bg-transparent px-2 py-0.5 text-[10px] text-red-600 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          )}
          {user && !isOwner && !flagging && (
            <button
              onClick={() => setFlagging(true)}
              aria-label="Report"
              className="border-none bg-transparent p-0.5 text-[10px] text-slate-300 transition-colors hover:text-red-400"
            >
              &#x1F6A9;
            </button>
          )}
          {flagging && (
            <div className="flex items-center gap-1">
              {[
                { k: "spam", l: "Spam" },
                { k: "offensive", l: "Offensive" },
                { k: "misinformation", l: "Inaccurate" },
              ].map((r) => (
                <button
                  key={r.k}
                  onClick={() => {
                    onFlag?.(perk, r.k);
                    setFlagging(false);
                  }}
                  className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] text-red-600 transition-colors hover:bg-red-100"
                >
                  {r.l}
                </button>
              ))}
              <button
                onClick={() => setFlagging(false)}
                className="border-none bg-transparent text-[10px] text-slate-400 hover:text-slate-600"
              >
                &#x2715;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
