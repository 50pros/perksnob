"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UseVoteReturn {
  votes: Record<string, number>; // perkId -> vote value (1 | -1 | 0)
  loadVotes: (perkIds: string[]) => Promise<void>;
  vote: (perkId: string, value: number) => Promise<void>;
}

export function useVote(userId: string | undefined): UseVoteReturn {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------------------------------------------------------------------ */
  /*  Load existing votes for a set of perk ids                          */
  /* ------------------------------------------------------------------ */

  const loadVotes = useCallback(
    async (perkIds: string[]) => {
      if (!userId || perkIds.length === 0) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("perk_votes")
        .select("perk_id, vote")
        .eq("user_id", userId)
        .in("perk_id", perkIds);

      if (error) {
        console.error("Failed to load votes:", error);
        return;
      }

      const map: Record<string, number> = {};
      (data || []).forEach((v) => {
        map[v.perk_id] = v.vote;
      });

      setVotes((prev) => ({ ...prev, ...map }));
    },
    [userId],
  );

  /* ------------------------------------------------------------------ */
  /*  Cast / change / remove a vote (debounced, optimistic)              */
  /* ------------------------------------------------------------------ */

  const vote = useCallback(
    async (perkId: string, value: number) => {
      if (!userId) return;

      // Optimistic local update
      setVotes((prev) => {
        const next = { ...prev };
        if (value === 0) {
          delete next[perkId];
        } else {
          next[perkId] = value;
        }
        return next;
      });

      // Debounce the actual network call (500ms)
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        const supabase = createClient();

        try {
          if (value === 0) {
            // Remove vote
            await supabase
              .from("perk_votes")
              .delete()
              .eq("perk_id", perkId)
              .eq("user_id", userId);
          } else {
            // Upsert vote
            const { error } = await supabase
              .from("perk_votes")
              .upsert(
                { perk_id: perkId, user_id: userId, vote: value },
                { onConflict: "perk_id,user_id" },
              );

            if (error) {
              console.error("Vote upsert failed:", error);
              // Revert optimistic update
              setVotes((prev) => {
                const reverted = { ...prev };
                delete reverted[perkId];
                return reverted;
              });
            }
          }
        } catch (err) {
          console.error("Vote failed:", err);
          // Revert on network error
          setVotes((prev) => {
            const reverted = { ...prev };
            delete reverted[perkId];
            return reverted;
          });
        }
      }, 500);
    },
    [userId],
  );

  return { votes, loadVotes, vote };
}
