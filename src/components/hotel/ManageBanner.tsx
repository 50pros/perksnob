"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Shows a manage CTA when the signed-in viewer has a verified claim on this
 *  hotel. Client-side so the hotel page stays ISR-cacheable. */
export default function ManageBanner({ hotelId }: { hotelId: string }) {
  const { user } = useAuth();
  const [manages, setManages] = useState(false);

  useEffect(() => {
    if (!user) {
      setManages(false);
      return;
    }
    let active = true;
    createClient()
      .from("hotel_claims")
      .select("id")
      .eq("hotel_id", hotelId)
      .eq("user_id", user.id)
      .eq("status", "verified")
      .maybeSingle()
      .then(({ data }) => {
        if (active) setManages(!!data);
      });
    return () => {
      active = false;
    };
  }, [user, hotelId]);

  if (!manages) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4">
      <p className="text-sm font-medium text-accent">
        You manage this property.
      </p>
      <Link
        href="/dashboard"
        className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-accent"
      >
        Edit your perks →
      </Link>
    </div>
  );
}
