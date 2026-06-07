"use client";

import type { Hotel } from "@/lib/types";
import FollowButton from "./FollowButton";

interface HotelCardProps {
  hotel: Hotel;
  perkCount: number;
  score: number;
  onClick: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
  isFollowBusy: boolean;
}

export default function HotelCard({
  hotel,
  perkCount,
  score,
  onClick,
  isFollowing,
  onToggleFollow,
  isFollowBusy,
}: HotelCardProps) {
  const scoreColor =
    score >= 70
      ? "text-green-600"
      : score >= 40
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${hotel.name} - ${perkCount} perk reports`}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="group relative flex cursor-pointer flex-col justify-between rounded-[10px] border border-slate-200 bg-white px-5 py-5 transition-all hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-lg"
    >
      {/* Follow button */}
      {onToggleFollow && (
        <div className="absolute right-3 top-3">
          <FollowButton
            isFollowing={isFollowing}
            isBusy={isFollowBusy}
            onClick={onToggleFollow}
          />
        </div>
      )}

      <div>
        {/* Brand + Score */}
        <div className="mb-1.5 flex items-start justify-between">
          <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-slate-400">
            {hotel.brand}
          </span>
          {score > 0 && (
            <span className={`text-[13px] font-bold ${scoreColor}`}>
              {score}
            </span>
          )}
        </div>

        {/* Name + Location */}
        <div className="mb-0.5 text-[15px] font-bold leading-tight text-slate-900">
          {hotel.name}
        </div>
        <div className="text-xs text-slate-400">{hotel.location}</div>
      </div>

      {/* Footer: perk count + room count */}
      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>
            <span className="text-[15px] font-bold text-slate-900">
              {perkCount}
            </span>{" "}
            perk reports
          </span>
          {hotel.room_count && (
            <span className="whitespace-nowrap text-[10px] text-slate-400">
              {hotel.room_count} rooms
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
