"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PerkReport } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { getCategory, timeAgo } from "@/lib/utils";
import AuthModal from "@/components/auth/AuthModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function FollowingPage() {
  const { user, loading: authLoading } = useAuth();
  const { followedIds } = useFollow(user?.id);
  const [reports, setReports] = useState<
    (PerkReport & { hotel_name?: string })[]
  >([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Fetch recent reports from followed hotels
  useEffect(() => {
    if (!user || followedIds.size === 0) {
      setReports([]);
      return;
    }

    (async () => {
      setLoadingReports(true);
      const supabase = createClient();
      const ids = Array.from(followedIds);

      const { data: perks } = await supabase
        .from("perk_reports")
        .select("*")
        .in("hotel_id", ids)
        .order("created_at", { ascending: false })
        .limit(300);

      const perkList = (perks || []) as PerkReport[];

      // Fetch hotel names
      const hotelIds = [...new Set(perkList.map((p) => p.hotel_id))];
      let hotelNames: Record<string, string> = {};

      if (hotelIds.length > 0) {
        const { data: hotels } = await supabase
          .from("hotels")
          .select("id, name")
          .in("id", hotelIds);

        (hotels || []).forEach((h: { id: string; name: string }) => {
          hotelNames[h.id] = h.name;
        });
      }

      setReports(
        perkList.map((p) => ({
          ...p,
          hotel_name: hotelNames[p.hotel_id] || "Unknown Hotel",
        }))
      );
      setLoadingReports(false);
    })();
  }, [user, followedIds]);

  // Group by hotel
  const grouped = useMemo(() => {
    const map: Record<string, (PerkReport & { hotel_name?: string })[]> = {};
    reports.forEach((r) => {
      const key = r.hotel_id;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map);
  }, [reports]);

  if (authLoading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="text-sm text-slate-500">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          &larr; Back to home
        </a>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight text-slate-900">
          Following
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Recent perk activity from hotels you follow.
        </p>

        {/* Auth gate */}
        {!user && (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-medium text-slate-700">
              Sign in to see your followed hotels
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Follow hotels to get a personalized activity feed.
            </p>
            <Button
              onClick={() => setAuthOpen(true)}
              className="mt-4"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        )}

        {/* Empty state */}
        {user && followedIds.size === 0 && !loadingReports && (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-medium text-slate-700">
              You&apos;re not following any hotels yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Visit hotel pages and click the follow button to add them here.
            </p>
          </div>
        )}

        {/* Loading */}
        {loadingReports && (
          <div className="mt-8 text-center text-sm text-slate-500">
            Loading activity feed...
          </div>
        )}

        {/* Activity feed grouped by hotel */}
        {user && grouped.length > 0 && !loadingReports && (
          <div className="mt-8 space-y-6">
            {grouped.map(([hotelId, items]) => (
              <div
                key={hotelId}
                className="rounded-lg border border-slate-200 bg-white overflow-hidden"
              >
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {items[0]?.hotel_name}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {items.length} recent{" "}
                    {items.length === 1 ? "report" : "reports"}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.slice(0, 20).map((item) => {
                    const cat = getCategory(item.category);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 px-5 py-3"
                      >
                        <span className="mt-0.5 text-base">{cat.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge>{cat.label}</Badge>
                            <span className="text-[10px] text-slate-400">
                              {timeAgo(item.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] leading-relaxed text-slate-600 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuth={() => setAuthOpen(false)}
      />
    </main>
  );
}
