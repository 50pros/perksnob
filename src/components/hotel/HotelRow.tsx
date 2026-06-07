"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Hotel } from "@/lib/types";
import HotelCard from "./HotelCard";

interface HotelRowProps {
  title: string;
  subtitle: string;
  hotels: Hotel[];
  perkCounts: Record<string, number>;
  scores: Record<string, number>;
  onSelect: (hotel: Hotel) => void;
  user: any;
  isFollowing: (hotelId: string) => boolean;
  onToggleFollow: (hotelId: string, following: boolean) => void;
  isFollowBusy: (hotelId: string) => boolean;
}

export default function HotelRow({
  title,
  subtitle,
  hotels,
  perkCounts,
  scores,
  onSelect,
  user,
  isFollowing,
  onToggleFollow,
  isFollowBusy,
}: HotelRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  if (!hotels?.length) return null;

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h3 className="m-0 text-[17px] font-bold text-slate-900">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>

        {/* Arrow controls */}
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-500 shadow-sm transition-all hover:border-slate-900 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-500 shadow-sm transition-all hover:border-slate-900 hover:text-slate-900"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="ps-row flex gap-3 overflow-x-auto scroll-smooth px-0.5 pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [scroll-snap-type:x_mandatory] [&::-webkit-scrollbar]:hidden"
      >
        {hotels.map((h) => {
          const c = perkCounts[h.id] || 0;
          const sc = scores[h.id] || 0;
          const followed = !!isFollowing?.(h.id);
          const busy = !!isFollowBusy?.(h.id);

          return (
            <div
              key={h.id}
              className="w-[260px] shrink-0 [scroll-snap-align:start]"
            >
              <HotelCard
                hotel={h}
                perkCount={c}
                score={sc}
                onClick={() => onSelect(h)}
                isFollowing={followed}
                onToggleFollow={() => onToggleFollow(h.id, followed)}
                isFollowBusy={busy}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
