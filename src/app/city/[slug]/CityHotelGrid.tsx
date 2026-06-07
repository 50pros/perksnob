"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Hotel } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { perkScore } from "@/lib/utils";
import HotelCard from "@/components/hotel/HotelCard";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 24;

interface CityHotelGridProps {
  hotels: Hotel[];
  perkCounts: Record<string, number>;
}

export default function CityHotelGrid({
  hotels,
  perkCounts,
}: CityHotelGridProps) {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { user } = useAuth();
  const { isFollowed, isBusy, toggle } = useFollow(user?.id);

  const totalPages = Math.ceil(hotels.length / PAGE_SIZE);
  const paginated = hotels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginated.map((hotel) => {
          const count = perkCounts[hotel.id] || 0;
          const cats = new Set<string>();
          const score = perkScore(count, cats.size);

          return (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              perkCount={count}
              score={score}
              onClick={() => router.push(`/hotel/${hotel.slug}`)}
              isFollowing={isFollowed(hotel.id)}
              onToggleFollow={() => toggle(hotel.id)}
              isFollowBusy={isBusy(hotel.id)}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            current={page}
            total={totalPages}
            onChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </>
  );
}
