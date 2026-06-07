"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UseFollowReturn {
  followedIds: Set<string>;
  isBusy: (hotelId: string) => boolean;
  isFollowed: (hotelId: string) => boolean;
  toggle: (hotelId: string) => Promise<void>;
}

export function useFollow(userId: string | undefined): UseFollowReturn {
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const busyRef = useRef<Set<string>>(new Set());
  // Re-render trigger for busyRef changes
  const [, forceUpdate] = useState(0);

  /* ------------------------------------------------------------------ */
  /*  Load initial followed hotel ids                                    */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!userId) {
        if (mounted) setFollowedIds(new Set());
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("hotel_follows")
        .select("hotel_id")
        .eq("user_id", userId);

      if (!mounted) return;

      if (error) {
        if (!String(error.message || "").includes("hotel_follows")) {
          console.error("Followed hotels load failed:", error);
        }
        setFollowedIds(new Set());
        return;
      }

      setFollowedIds(new Set((data || []).map((r) => r.hotel_id)));
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  /* ------------------------------------------------------------------ */
  /*  Query helpers                                                      */
  /* ------------------------------------------------------------------ */

  const isBusy = useCallback(
    (hotelId: string) => busyRef.current.has(hotelId),
    [],
  );

  const isFollowed = useCallback(
    (hotelId: string) => followedIds.has(hotelId),
    [followedIds],
  );

  /* ------------------------------------------------------------------ */
  /*  Optimistic toggle                                                  */
  /* ------------------------------------------------------------------ */

  const toggle = useCallback(
    async (hotelId: string) => {
      if (!userId) return;
      if (busyRef.current.has(hotelId)) return;

      busyRef.current.add(hotelId);
      forceUpdate((n) => n + 1);

      const wasFollowed = followedIds.has(hotelId);

      // Optimistic update
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (wasFollowed) {
          next.delete(hotelId);
        } else {
          next.add(hotelId);
        }
        return next;
      });

      const supabase = createClient();

      try {
        if (wasFollowed) {
          const { error } = await supabase
            .from("hotel_follows")
            .delete()
            .eq("hotel_id", hotelId)
            .eq("user_id", userId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("hotel_follows")
            .insert({ hotel_id: hotelId, user_id: userId });

          // 23505 = unique constraint — treat as success (already followed)
          if (error && error.code !== "23505") throw error;
        }
      } catch {
        // Revert on error
        setFollowedIds((prev) => {
          const reverted = new Set(prev);
          if (wasFollowed) {
            reverted.add(hotelId);
          } else {
            reverted.delete(hotelId);
          }
          return reverted;
        });

        // Surface error to consumers via console; callers can show their own toast
        console.error("Could not update follow status");
      } finally {
        busyRef.current.delete(hotelId);
        forceUpdate((n) => n + 1);
      }
    },
    [userId, followedIds],
  );

  return { followedIds, isBusy, isFollowed, toggle };
}
