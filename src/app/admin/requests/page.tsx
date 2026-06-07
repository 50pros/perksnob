"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { HotelRequest } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "duplicate";

export default function AdminRequestsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<HotelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});

  // Load requests
  useEffect(() => {
    if (!isAdmin) return;

    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("hotel_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Failed to load requests:", error);
      }
      setRequests((data || []) as HotelRequest[]);
      setLoading(false);
    })();
  }, [isAdmin]);

  // Filter counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: requests.length };
    requests.forEach((r) => {
      c[r.status] = (c[r.status] || 0) + 1;
    });
    return c;
  }, [requests]);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  // Approve request: create hotel + update request
  const handleApprove = useCallback(
    async (req: HotelRequest) => {
      if (!user) return;
      setActionBusy((prev) => ({ ...prev, [req.id]: true }));

      try {
        const supabase = createClient();

        // Generate slug and check for collisions
        let baseSlug = slugify(req.hotel_name);
        let slug = baseSlug;
        let suffix = 1;

        while (true) {
          const { data: existing } = await supabase
            .from("hotels")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

          if (!existing) break;
          slug = `${baseSlug}-${suffix}`;
          suffix++;
          if (suffix > 20) break;
        }

        // Create the hotel
        const { data: newHotel, error: hotelError } = await supabase
          .from("hotels")
          .insert({
            name: req.hotel_name,
            brand: req.brand || "Marriott",
            location: [req.city, req.state, req.country]
              .filter(Boolean)
              .join(", "),
            slug,
            status: "approved",
            submitted_by: req.user_id,
            country: req.country,
            marriott_code: req.marriott_code,
            website: req.marriott_url,
          })
          .select("id")
          .single();

        if (hotelError) throw hotelError;

        // Update request status
        const { error: updateError } = await supabase
          .from("hotel_requests")
          .update({
            status: "approved",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            hotel_id: newHotel?.id,
          })
          .eq("id", req.id);

        if (updateError) throw updateError;

        // Update local state
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? {
                  ...r,
                  status: "approved" as const,
                  reviewed_by: user.id,
                  reviewed_at: new Date().toISOString(),
                  hotel_id: newHotel?.id || null,
                }
              : r
          )
        );

        showToast(`Approved: ${req.hotel_name}`);
      } catch (err) {
        console.error("Approve failed:", err);
        showToast("Failed to approve request", "error");
      }

      setActionBusy((prev) => ({ ...prev, [req.id]: false }));
    },
    [user]
  );

  // Reject request
  const handleReject = useCallback(
    async (req: HotelRequest) => {
      if (!user) return;
      setActionBusy((prev) => ({ ...prev, [req.id]: true }));

      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("hotel_requests")
          .update({
            status: "rejected",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", req.id);

        if (error) throw error;

        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? {
                  ...r,
                  status: "rejected" as const,
                  reviewed_by: user.id,
                  reviewed_at: new Date().toISOString(),
                }
              : r
          )
        );

        showToast("Request rejected");
      } catch {
        showToast("Failed to reject request", "error");
      }

      setActionBusy((prev) => ({ ...prev, [req.id]: false }));
    },
    [user]
  );

  // Mark duplicate
  const handleDuplicate = useCallback(
    async (req: HotelRequest) => {
      if (!user) return;
      setActionBusy((prev) => ({ ...prev, [req.id]: true }));

      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("hotel_requests")
          .update({
            status: "duplicate",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", req.id);

        if (error) throw error;

        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? {
                  ...r,
                  status: "duplicate" as const,
                  reviewed_by: user.id,
                  reviewed_at: new Date().toISOString(),
                }
              : r
          )
        );

        showToast("Marked as duplicate");
      } catch {
        showToast("Failed to mark as duplicate", "error");
      }

      setActionBusy((prev) => ({ ...prev, [req.id]: false }));
    },
    [user]
  );

  if (authLoading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="text-sm text-slate-500">Loading...</div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to view this page.
          </p>
          <a
            href="/"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Go home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          &larr; Back to home
        </a>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight text-slate-900">
          Hotel Requests
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Review and manage hotel submission requests.
        </p>

        {/* Status filter tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {(
            ["all", "pending", "approved", "rejected", "duplicate"] as const
          ).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={[
                "rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                filter === status
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              ].join(" ")}
            >
              {status}
              <span className="ml-1.5 text-[10px] opacity-70">
                ({counts[status] || 0})
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 text-center text-sm text-slate-500">
            Loading requests...
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              No {filter === "all" ? "" : filter} requests found.
            </p>
          </div>
        )}

        {/* Request cards */}
        {!loading && filtered.length > 0 && (
          <div className="mt-6 space-y-4">
            {filtered.map((req) => {
              const busy = actionBusy[req.id] || false;
              const isPending = req.status === "pending";

              return (
                <div
                  key={req.id}
                  className="rounded-lg border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-slate-900">
                          {req.hotel_name}
                        </h3>
                        <span
                          className={[
                            "inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                            req.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : req.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : req.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        {req.brand && (
                          <span>
                            <span className="font-medium text-slate-700">
                              Brand:
                            </span>{" "}
                            {req.brand}
                          </span>
                        )}
                        {req.city && (
                          <span>
                            <span className="font-medium text-slate-700">
                              City:
                            </span>{" "}
                            {req.city}
                          </span>
                        )}
                        {req.country && (
                          <span>
                            <span className="font-medium text-slate-700">
                              Country:
                            </span>{" "}
                            {req.country}
                          </span>
                        )}
                        {req.marriott_code && (
                          <span>
                            <span className="font-medium text-slate-700">
                              Code:
                            </span>{" "}
                            {req.marriott_code}
                          </span>
                        )}
                      </div>

                      {req.marriott_url && (
                        <a
                          href={req.marriott_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                        >
                          Marriott URL
                        </a>
                      )}

                      {req.notes && (
                        <p className="mt-2 text-xs text-slate-500 italic">
                          {req.notes}
                        </p>
                      )}

                      <p className="mt-2 text-[10px] text-slate-400">
                        Submitted{" "}
                        {new Date(req.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Action buttons */}
                    {isPending && (
                      <div className="flex shrink-0 flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req)}
                          loading={busy}
                          disabled={busy}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReject(req)}
                          disabled={busy}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(req)}
                          disabled={busy}
                        >
                          Duplicate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
