import { useMemo } from "react";
import type { Hotel } from "@/lib/types";
import { haversine } from "@/lib/utils";

interface NearbyHotelsProps {
  hotel: Hotel;
  allHotels: Hotel[];
  perkCounts: Record<string, number>;
  onSelect: (hotel: Hotel) => void;
}

export default function NearbyHotels({
  hotel,
  allHotels,
  perkCounts,
  onSelect,
}: NearbyHotelsProps) {
  if (!hotel.latitude || !hotel.longitude) return null;

  const nearby = useMemo(
    () =>
      allHotels
        .filter(
          (h) => h.id !== hotel.id && h.latitude != null && h.longitude != null,
        )
        .map((h) => ({
          ...h,
          dist: haversine(
            hotel.latitude!,
            hotel.longitude!,
            h.latitude!,
            h.longitude!,
          ),
        }))
        .filter((h) => h.dist < 50)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 8),
    [hotel.id, hotel.latitude, hotel.longitude, allHotels],
  );

  if (!nearby.length) return null;

  return (
    <div className="mt-8">
      <h3 className="mb-3.5 text-base font-bold text-slate-900">
        Nearby Marriott Properties
      </h3>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
        {nearby.map((h) => (
          <div
            key={h.id}
            onClick={() => onSelect(h)}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3.5 transition-all hover:-translate-y-px hover:border-slate-900"
          >
            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {h.brand}
            </div>
            <div className="mb-0.5 text-[13px] font-bold leading-tight text-slate-900">
              {h.name}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {h.dist < 1
                  ? `${Math.round(h.dist * 1000)}m away`
                  : `${h.dist.toFixed(1)} km`}
              </span>
              <span className="text-[11px] font-bold text-slate-900">
                {perkCounts[h.id] || 0} reports
              </span>
            </div>

            {h.room_count && (
              <div className="mt-1 text-[10px] text-slate-400">
                {h.room_count} rooms
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
