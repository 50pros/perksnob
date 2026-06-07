"use client";

import { useRef } from "react";
import HotelCard from "./HotelCard";
import type { HomeHotel } from "@/lib/data";

export default function HotelScrollRow({
  title,
  subtitle,
  hotels,
}: {
  title: string;
  subtitle: string;
  hotels: HomeHotel[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) =>
    ref.current?.scrollBy({ left: dir * 600, behavior: "smooth" });

  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="rounded-lg border border-line px-3 py-2 text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            ←
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="rounded-lg border border-line px-3 py-2 text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {hotels.map((h) => (
          <div key={h.slug} className="w-[270px] shrink-0 snap-start">
            <HotelCard hotel={h} score={h.score} />
          </div>
        ))}
      </div>
    </section>
  );
}
