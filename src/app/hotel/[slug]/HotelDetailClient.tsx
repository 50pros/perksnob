"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type {
  Hotel,
  PerkReport,
  Comment,
  EliteTier,
  PerkCategory,
} from "@/lib/types";
import {
  TIERS,
  CATS,
  MAX_TIP,
  PAGE_SIZE,
} from "@/lib/constants";
import {
  getTier,
  getCategory,
  perkScore,
  sortPerksByStayDate,
  timeAgo,
  displayName,
  sanitize,
  hasProfanity,
  perkOutcome,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHotels } from "@/hooks/useHotels";
import { useFollow } from "@/hooks/useFollow";
import { useVote } from "@/hooks/useVote";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HotelInfoBar from "@/components/hotel/HotelInfoBar";
import NearbyHotels from "@/components/hotel/NearbyHotels";
import FollowButton from "@/components/hotel/FollowButton";
import ScoreBadge from "@/components/ui/ScoreBadge";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";

import TierSection from "@/components/perk/TierSection";
import PerkLikelihoodSummary from "@/components/perk/PerkLikelihoodSummary";
import PerkSubmitForm from "@/components/perk/PerkSubmitForm";
import AiSummaryCard from "@/components/perk/AiSummaryCard";
import GatedEmail from "@/components/auth/GatedEmail";
import AuthModal from "@/components/auth/AuthModal";
import RequestHotelModal from "@/components/layout/RequestHotelModal";

/* ------------------------------------------------------------------ */
/*  Tier cascade: which tiers can each tier see?                      */
/* ------------------------------------------------------------------ */

const TIER_CASCADE: Record<EliteTier, EliteTier[]> = {
  ambassador: ["ambassador", "titanium", "platinum", "gold", "silver"],
  titanium: ["titanium", "platinum", "gold", "silver"],
  platinum: ["platinum", "gold", "silver"],
  gold: ["gold", "silver"],
  silver: ["silver"],
};

const TIER_ORDER: EliteTier[] = [
  "ambassador",
  "titanium",
  "platinum",
  "gold",
  "silver",
];

/* ------------------------------------------------------------------ */
/*  Client component                                                  */
/* ------------------------------------------------------------------ */

interface HotelDetailClientProps {
  hotel: Hotel;
}

export default function HotelDetailClient({ hotel }: HotelDetailClientProps) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { hotels, perkCounts, scores, hotelPerks } = useHotels();
  const { isFollowed, isBusy, toggle } = useFollow(user?.id);
  const { votes, loadVotes, vote } = useVote(user?.id);

  /* --- State -------------------------------------------------------- */
  const [perks, setPerks] = useState<(PerkReport & { upvotes?: number; downvotes?: number; my_vote?: number })[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Category filter chips
  const [perkCategoryFilter, setPerkCategoryFilter] = useState<string>("");

  // Comment form
  const [commentTier, setCommentTier] = useState<EliteTier | "">("");
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Auth modal
  const [showAuth, setShowAuth] = useState(false);
  const [showReqHotel, setShowReqHotel] = useState(false);

  // Header search (minimal; used to satisfy Header prop)
  const [headerSearch, setHeaderSearch] = useState("");

  /* --- Computed values ---------------------------------------------- */
  const hotelScore = scores[hotel.id] || 0;
  const hotelPerkCount = perkCounts[hotel.id] || 0;

  /* --- Data loading ------------------------------------------------- */
  const fetchData = useCallback(async () => {
    const supabase = createClient();

    try {
      // Fetch perk reports with vote sums
      const { data: perkData, error: perkErr } = await supabase
        .from("perk_reports")
        .select(`
          *,
          upvotes:perk_votes(count).filter(vote.eq.1),
          downvotes:perk_votes(count).filter(vote.eq.-1)
        `)
        .eq("hotel_id", hotel.id)
        .order("created_at", { ascending: false });

      if (perkErr) {
        // Fallback: fetch without votes
        const { data: fallbackPerks } = await supabase
          .from("perk_reports")
          .select("*")
          .eq("hotel_id", hotel.id)
          .order("created_at", { ascending: false });
        setPerks((fallbackPerks as any[]) || []);
      } else {
        // Normalize vote counts from the nested aggregation
        const normalized = (perkData || []).map((p: any) => ({
          ...p,
          upvotes: Array.isArray(p.upvotes) ? p.upvotes[0]?.count || 0 : 0,
          downvotes: Array.isArray(p.downvotes)
            ? p.downvotes[0]?.count || 0
            : 0,
        }));
        setPerks(normalized);

        // Load user's votes for these perks
        if (user?.id && normalized.length > 0) {
          loadVotes(normalized.map((p: any) => p.id));
        }
      }

      // Fetch comments
      const { data: commentData } = await supabase
        .from("comments")
        .select("*")
        .eq("hotel_id", hotel.id)
        .order("created_at", { ascending: false });
      setComments((commentData as Comment[]) || []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [hotel.id, user?.id, loadVotes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* --- Sort perks by stay date ------------------------------------- */
  const sortedPerks = useMemo(
    () => sortPerksByStayDate(perks),
    [perks],
  );

  /* --- Category-filtered perks ------------------------------------- */
  const filteredPerks = useMemo(() => {
    if (!perkCategoryFilter) return sortedPerks;
    return sortedPerks.filter((p) => p.category === perkCategoryFilter);
  }, [sortedPerks, perkCategoryFilter]);

  /* --- Perks grouped by tier --------------------------------------- */
  const perksByTier = useMemo(() => {
    const map: Record<EliteTier, typeof filteredPerks> = {
      ambassador: [],
      titanium: [],
      platinum: [],
      gold: [],
      silver: [],
    };
    filteredPerks.forEach((p) => {
      if (map[p.elite_tier]) {
        map[p.elite_tier].push(p);
      }
    });
    return map;
  }, [filteredPerks]);

  /* --- Tier stats (perks per tier) --------------------------------- */
  const tierStats = useMemo(() => {
    const stats: Record<EliteTier, number> = {
      ambassador: 0,
      titanium: 0,
      platinum: 0,
      gold: 0,
      silver: 0,
    };
    sortedPerks.forEach((p) => {
      if (stats[p.elite_tier] !== undefined) {
        stats[p.elite_tier]++;
      }
    });
    return stats;
  }, [sortedPerks]);

  /* --- Used categories (for filter chips) -------------------------- */
  const usedCategories = useMemo(() => {
    const set = new Set<string>();
    sortedPerks.forEach((p) => set.add(p.category));
    return CATS.filter((c) => set.has(c.key));
  }, [sortedPerks]);

  /* --- User's tier (for cascade + highlight) ----------------------- */
  const userTier = user?.user_metadata?.elite_tier as EliteTier | undefined;

  /* --- Handlers ----------------------------------------------------- */
  const handleVote = useCallback(
    (perk: PerkReport, value: number) => {
      if (!user) {
        setShowAuth(true);
        return;
      }
      vote(perk.id, value);
      // Optimistic UI update for the perk
      setPerks((prev) =>
        prev.map((p) => {
          if (p.id !== perk.id) return p;
          const oldVote = votes[perk.id] || 0;
          let ups = p.upvotes || 0;
          let downs = p.downvotes || 0;
          // Remove old vote
          if (oldVote === 1) ups--;
          if (oldVote === -1) downs--;
          // Add new vote
          if (value === 1) ups++;
          if (value === -1) downs++;
          return { ...p, upvotes: ups, downvotes: downs, my_vote: value };
        }),
      );
    },
    [user, vote, votes],
  );

  const handleEdit = useCallback(
    (perk: PerkReport) => {
      // Scroll to form section and pre-fill (simplified: just open form)
      showToast("Edit mode: modify and resubmit your perk report");
    },
    [],
  );

  const handleDelete = useCallback(
    async (perk: PerkReport) => {
      if (!user || perk.user_id !== user.id) return;
      const supabase = createClient();
      const { error: delErr } = await supabase
        .from("perk_reports")
        .delete()
        .eq("id", perk.id)
        .eq("user_id", user.id);

      if (delErr) {
        showToast("Failed to delete perk report", "error");
        return;
      }

      setPerks((prev) => prev.filter((p) => p.id !== perk.id));
      showToast("Perk report deleted");
    },
    [user],
  );

  const handleToggleFollow = useCallback(() => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    toggle(hotel.id);
  }, [user, toggle, hotel.id]);

  const submitComment = useCallback(async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!commentTier) {
      showToast("Please select your tier", "error");
      return;
    }
    if (!commentText.trim()) {
      showToast("Please enter a tip or comment", "error");
      return;
    }
    if (commentText.trim().length > MAX_TIP) {
      showToast(`Comment must be ${MAX_TIP} characters or less`, "error");
      return;
    }
    if (hasProfanity(commentText)) {
      showToast("Please remove inappropriate language", "error");
      return;
    }

    setCommentSubmitting(true);
    const supabase = createClient();
    const dName = displayName(user);

    const { data, error: insertErr } = await supabase
      .from("comments")
      .insert({
        hotel_id: hotel.id,
        user_id: user.id,
        display_name: dName,
        elite_tier: commentTier,
        text: sanitize(commentText),
      })
      .select("*")
      .single();

    setCommentSubmitting(false);

    if (insertErr) {
      showToast("Failed to post comment: " + insertErr.message, "error");
      return;
    }

    if (data) {
      setComments((prev) => [data as Comment, ...prev]);
    }
    setCommentText("");
    setCommentTier("");
    showToast("Tip posted!");
  }, [user, commentTier, commentText, hotel.id]);

  const navigateToHotel = useCallback(
    (h: Hotel) => {
      router.push(`/hotel/${h.slug}`);
    },
    [router],
  );

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ============================================================ */}
      {/*  Dark hero section                                           */}
      {/* ============================================================ */}
      <div className="bg-slate-900 pb-8">
        <Header
          user={user}
          isAdmin={isAdmin}
          onAuthClick={() => setShowAuth(true)}
          search={headerSearch}
          onSearchChange={(v) => {
            setHeaderSearch(v);
            if (v.trim()) router.push("/");
          }}
        />

        <div className="mx-auto max-w-[1100px] px-7 pt-6">
          {/* Back button */}
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 no-underline transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Hotels
          </Link>

          {/* Brand label */}
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[2px] text-slate-400">
            {hotel.brand}
          </div>

          {/* Hotel name + score + follow */}
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1">
              <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight text-white sm:text-4xl">
                {hotel.name}
              </h1>
              <p className="mt-1.5 text-sm text-slate-400">{hotel.location}</p>
            </div>

            <div className="flex items-center gap-3">
              {hotelScore > 0 && <ScoreBadge score={hotelScore} />}
              <FollowButton
                isFollowing={isFollowed(hotel.id)}
                isBusy={isBusy(hotel.id)}
                onClick={handleToggleFollow}
              />
            </div>
          </div>

          {/* Tier stats grid */}
          <div className="mt-5 grid grid-cols-5 gap-2 sm:max-w-[500px]">
            {TIER_ORDER.map((tierKey) => {
              const t = getTier(tierKey);
              const count = tierStats[tierKey] || 0;
              return (
                <div
                  key={tierKey}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-center"
                >
                  <div
                    className="text-[9px] font-bold uppercase tracking-wide"
                    style={{ color: t.color === "#1a1a1a" ? "#e2e8f0" : t.color }}
                  >
                    {t.label.split(" ")[0]}
                  </div>
                  <div className="mt-0.5 text-lg font-bold text-white">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hotel info bar */}
          <div className="mt-5">
            <HotelInfoBar hotel={hotel} />
          </div>

          {/* Gated email */}
          <div className="mt-3">
            <GatedEmail
              hotel={hotel}
              user={user}
              onNeedAuth={() => setShowAuth(true)}
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Content area                                                */}
      {/* ============================================================ */}
      <div className="mx-auto max-w-[1100px] px-7 py-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* ======================================================= */}
            {/*  Main column                                            */}
            {/* ======================================================= */}
            <div className="min-w-0">
              {/* AI Summary Card */}
              <AiSummaryCard hotelId={hotel.id} perkCount={sortedPerks.length} />

              {/* Perk Likelihood Summary */}
              <PerkLikelihoodSummary perks={sortedPerks as any} />

              {/* ------------------------------------------------------- */}
              {/*  Perk submission form                                   */}
              {/* ------------------------------------------------------- */}
              <PerkSubmitForm
                hotelId={hotel.id}
                user={user}
                onSuccess={() => {
                  showToast("Perk report submitted! Thank you for contributing.");
                  fetchData();
                }}
                onNeedAuth={() => setShowAuth(true)}
              />

              {/* ------------------------------------------------------- */}
              {/*  Category filter chips                                  */}
              {/* ------------------------------------------------------- */}
              {usedCategories.length > 0 && (
                <div className="mt-8 mb-5">
                  <div className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                    Filter by Category
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPerkCategoryFilter("")}
                      className={[
                        "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all",
                        !perkCategoryFilter
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-900",
                      ].join(" ")}
                    >
                      All ({sortedPerks.length})
                    </button>
                    {usedCategories.map((c) => {
                      const count = sortedPerks.filter(
                        (p) => p.category === c.key,
                      ).length;
                      const active = perkCategoryFilter === c.key;
                      return (
                        <button
                          key={c.key}
                          onClick={() =>
                            setPerkCategoryFilter(active ? "" : c.key)
                          }
                          className={[
                            "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all",
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-900",
                          ].join(" ")}
                        >
                          {c.icon} {c.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/*  Tier cascade note                                      */}
              {/* ------------------------------------------------------- */}
              {sortedPerks.length > 0 && (
                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                  <strong>Tier cascade:</strong> Higher tiers can generally
                  expect at minimum the perks reported for lower tiers.
                  Ambassador sees all tiers. Titanium sees Titanium, Platinum,
                  Gold, Silver. And so on.
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/*  Tier sections                                          */}
              {/* ------------------------------------------------------- */}
              {sortedPerks.length === 0 && !loading && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
                  <div className="mb-3 text-4xl">&#x1F4CB;</div>
                  <p className="text-lg font-semibold text-slate-700">
                    No perk reports yet
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Be the first to report your elite benefits at this property!
                  </p>
                </div>
              )}

              {TIER_ORDER.map((tierKey) => {
                const tierPerks = perksByTier[tierKey];
                const isUserTier = userTier === tierKey;
                // Only show the tier section if it has perks or it's the user's tier
                if (tierPerks.length === 0 && !isUserTier) return null;

                return (
                  <TierSection
                    key={tierKey}
                    tier={tierKey}
                    perks={tierPerks.map((p) => ({
                      ...p,
                      my_vote: votes[p.id] || 0,
                    })) as any}
                    user={user}
                    onVote={handleVote}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    defaultOpen={tierPerks.length > 0}
                    highlight={isUserTier}
                  />
                );
              })}

              {/* ------------------------------------------------------- */}
              {/*  Nearby Hotels                                          */}
              {/* ------------------------------------------------------- */}
              <NearbyHotels
                hotel={hotel}
                allHotels={hotels}
                perkCounts={perkCounts}
                onSelect={navigateToHotel}
              />
            </div>

            {/* ======================================================= */}
            {/*  Sidebar: Comments / Tips                                */}
            {/* ======================================================= */}
            <aside className="min-w-0">
              <div className="sticky top-6">
                <div className="rounded-[10px] border border-slate-200 bg-white p-5">
                  <h3 className="mb-1 text-base font-bold text-slate-900">
                    Tips & Comments
                  </h3>
                  <p className="mb-4 text-[11px] text-slate-400">
                    Share tips for fellow elite members staying here
                  </p>

                  {/* Add tip form */}
                  <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3">
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Your Tier
                      </label>
                      <select
                        value={commentTier}
                        onChange={(e) => {
                          if (!user) {
                            setShowAuth(true);
                            return;
                          }
                          setCommentTier(e.target.value as EliteTier);
                        }}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                      >
                        <option value="">Select...</option>
                        {TIERS.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        <span>Your Tip</span>
                        <span className="font-normal normal-case">
                          {commentText.length}/{MAX_TIP}
                        </span>
                      </label>
                      <textarea
                        value={commentText}
                        onChange={(e) => {
                          if (!user) {
                            setShowAuth(true);
                            return;
                          }
                          setCommentText(e.target.value.slice(0, MAX_TIP));
                        }}
                        placeholder="e.g., Ask for the club lounge floor for best upgrade chances..."
                        maxLength={MAX_TIP}
                        onFocus={() => {
                          if (!user) setShowAuth(true);
                        }}
                        className="min-h-[70px] w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                      />
                    </div>

                    <button
                      onClick={submitComment}
                      disabled={commentSubmitting}
                      className="w-full rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {commentSubmitting ? "Posting..." : "Post Tip"}
                    </button>
                  </div>

                  {/* Comments list */}
                  {comments.length === 0 && (
                    <div className="py-5 text-center text-xs text-slate-400">
                      No tips yet. Be the first to share!
                    </div>
                  )}

                  <div className="space-y-0">
                    {comments.map((c) => {
                      const tier = getTier(c.elite_tier);
                      return (
                        <div
                          key={c.id}
                          className="border-b border-slate-100 py-3 last:border-b-0"
                        >
                          {/* Header: avatar + name + tier + date */}
                          <div className="mb-1.5 flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">
                              {(c.display_name || "A").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-slate-700">
                              {c.display_name || "Anonymous"}
                            </span>
                            <Badge
                              variant="default"
                              className="text-[8px]"
                            >
                              <span style={{ color: tier.color }}>
                                {tier.label.split(" ")[0]}
                              </span>
                            </Badge>
                            <span className="ml-auto text-[10px] text-slate-400">
                              {timeAgo(c.created_at)}
                            </span>
                          </div>
                          {/* Comment text */}
                          <p className="text-xs leading-relaxed text-slate-600">
                            {c.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Modals                                                      */}
      {/* ============================================================ */}
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onAuth={() => {
          setShowAuth(false);
          fetchData();
        }}
      />

      <RequestHotelModal
        open={showReqHotel}
        onClose={() => setShowReqHotel(false)}
        user={user}
      />

      {/* ============================================================ */}
      {/*  Footer                                                      */}
      {/* ============================================================ */}
      <Footer
        onAddHotel={() => {
          if (!user) {
            setShowAuth(true);
            return;
          }
          setShowReqHotel(true);
        }}
      />
    </main>
  );
}
