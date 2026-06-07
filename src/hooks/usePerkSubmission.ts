"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_DESC } from "@/lib/constants";
import { sanitize, hasProfanity } from "@/lib/utils";
import type { PerkCategory, EliteTier } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PerkEntry {
  category: PerkCategory | "";
  description: string;
  report_outcome: string;
  category_details: Record<string, string | number | null>;
}

export interface UsePerkSubmissionReturn {
  entries: PerkEntry[];
  tier: EliteTier | "";
  stayDate: string;
  bookingType: string;
  promoCode: string;
  upgradeType: string;
  submitting: boolean;
  setTier: (tier: EliteTier | "") => void;
  setStayDate: (date: string) => void;
  setBookingType: (type: string) => void;
  setPromoCode: (code: string) => void;
  setUpgradeType: (type: string) => void;
  updateEntry: (index: number, entry: Partial<PerkEntry>) => void;
  addEntry: () => void;
  removeEntry: (index: number) => void;
  submit: (displayName: string) => Promise<boolean>;
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function emptyEntry(): PerkEntry {
  return {
    category: "",
    description: "",
    report_outcome: "received",
    category_details: {},
  };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePerkSubmission(
  hotelId: string,
  userId: string | undefined,
): UsePerkSubmissionReturn {
  const [entries, setEntries] = useState<PerkEntry[]>([emptyEntry()]);
  const [tier, setTier] = useState<EliteTier | "">("");
  const [stayDate, setStayDate] = useState("");
  const [bookingType, setBookingType] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [upgradeType, setUpgradeType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const lastSubmitRef = useRef<number>(0);

  /* ------------------------------------------------------------------ */
  /*  Entry management                                                   */
  /* ------------------------------------------------------------------ */

  const updateEntry = useCallback(
    (index: number, partial: Partial<PerkEntry>) => {
      setEntries((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...partial };
        return next;
      });
    },
    [],
  );

  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, emptyEntry()]);
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Reset form                                                         */
  /* ------------------------------------------------------------------ */

  const reset = useCallback(() => {
    setTier("");
    setStayDate("");
    setBookingType("");
    setPromoCode("");
    setUpgradeType("");
    setEntries([emptyEntry()]);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Submit                                                             */
  /* ------------------------------------------------------------------ */

  const submit = useCallback(
    async (displayName: string): Promise<boolean> => {
      if (!userId) return false;

      // Validate tier
      if (!tier) return false;

      // Filter entries that have a category and description
      const valid = entries.filter(
        (e) => e.category && e.description.trim(),
      );

      if (valid.length === 0) return false;

      // Validate each entry
      for (const e of valid) {
        if (e.description.trim().length > MAX_DESC) {
          return false;
        }
        if (hasProfanity(e.description)) {
          return false;
        }
      }

      // Rate limiting: 10-second gap between submissions
      const now = Date.now();
      if (now - lastSubmitRef.current < 10_000) {
        return false;
      }

      setSubmitting(true);

      const supabase = createClient();

      try {
        const rows = valid.map((e) => {
          const row: Record<string, unknown> = {
            hotel_id: hotelId,
            user_id: userId,
            display_name: displayName,
            elite_tier: tier,
            category: e.category,
            description: sanitize(e.description),
          };

          if (stayDate) row.stay_date = stayDate + "-01";
          if (bookingType) row.booking_type = bookingType;
          if (promoCode.trim()) row.promo_code = sanitize(promoCode);
          if (e.category === "upgrade" && upgradeType) {
            row.upgrade_type = upgradeType;
          }

          // Build category_details, filtering out empty values
          const cd = Object.fromEntries(
            Object.entries(e.category_details || {}).filter(
              ([, v]) => v !== undefined && v !== "" && v !== 0,
            ),
          );
          (cd as Record<string, unknown>).report_outcome =
            e.report_outcome === "not_received" ? "not_received" : "received";

          if (Object.keys(cd).length > 0) {
            row.category_details = cd;
          }

          return row;
        });

        const { error } = await supabase.from("perk_reports").insert(rows);

        if (error) {
          // On error: do NOT reset form (fixes original bug)
          setSubmitting(false);
          return false;
        }

        lastSubmitRef.current = now;

        // On success: reset form
        reset();
        setSubmitting(false);
        return true;
      } catch {
        // On error: do NOT reset form
        setSubmitting(false);
        return false;
      }
    },
    [
      userId,
      hotelId,
      tier,
      entries,
      stayDate,
      bookingType,
      promoCode,
      upgradeType,
      reset,
    ],
  );

  return {
    entries,
    tier,
    stayDate,
    bookingType,
    promoCode,
    upgradeType,
    submitting,
    setTier,
    setStayDate,
    setBookingType,
    setPromoCode,
    setUpgradeType,
    updateEntry,
    addEntry,
    removeEntry,
    submit,
    reset,
  };
}
