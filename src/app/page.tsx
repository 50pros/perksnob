"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Hotel, PerkReport } from "@/lib/types";
import { BRANDS, TIERS, PAGE_SIZE } from "@/lib/constants";
import { perkOutcome, toTimestamp } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useHotels } from "@/hooks/useHotels";
import { useFollow } from "@/hooks/useFollow";
import { useDebounce } from "@/hooks/useDebounce";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HotelRow from "@/components/hotel/HotelRow";
import HotelCard from "@/components/hotel/HotelCard";
import Pagination from "@/components/ui/Pagination";
import { CardSkeleton } from "@/components/ui/Skeleton";
import AuthModal from "@/components/auth/AuthModal";
import AddPerkModal from "@/components/layout/AddPerkModal";
import RequestHotelModal from "@/components/layout/RequestHotelModal";

/* ------------------------------------------------------------------ */
/*  Perk filter definitions (12 toggleable filter chips)              */
/* ------------------------------------------------------------------ */

interface PerkFilterDef {
  key: string;
  label: string;
  test: (perks: Array<{ category: string; category_details: Record<string, string | number | null> | null }> | undefined) => boolean;
}

function received(
  perks: Array<{ category: string; category_details: Record<string, string | number | null> | null }> | undefined,
  category: string,
  extraCheck?: (d: Record<string, string | number | null>) => boolean,
): boolean {
  if (!perks) return false;
  return perks.some((p) => {
    if (p.category !== category) return false;
    // Check outcome via the perkOutcome utility shape
    const d = p.category_details || {};
    const outcome =
      d.report_outcome === "not_received" ? "not_received" : "received";
    if (outcome !== "received") return false;
    if (extraCheck && !extraCheck(d)) return false;
    return true;
  });
}

const PERK_FILTERS: PerkFilterDef[] = [
  {
    key: "free_breakfast",
    label: "Free Breakfast",
    test: (perks) =>
      received(perks, "breakfast", (d) => d.cost !== "Not included"),
  },
  {
    key: "lounge_open",
    label: "Lounge Open",
    test: (perks) =>
      received(
        perks,
        "lounge",
        (d) => d.status !== "Closed" && d.status !== "No lounge",
      ),
  },
  {
    key: "suite_upgrade",
    label: "Suite Upgrade",
    test: (perks) => received(perks, "upgrade"),
  },
  {
    key: "late_checkout",
    label: "Late Checkout",
    test: (perks) =>
      received(
        perks,
        "late_checkout",
        (d) => d.time_granted !== "No late checkout",
      ),
  },
  {
    key: "free_parking",
    label: "Free Parking",
    test: (perks) =>
      received(perks, "parking", (d) => d.included !== "No, full price"),
  },
  {
    key: "solid_bathroom",
    label: "Solid Bathroom",
    test: (perks) =>
      received(
        perks,
        "bathroom",
        (d) =>
          d.door_type === "Solid wood/standard" || d.door_type === "Pocket door",
      ),
  },
  {
    key: "spa_perks",
    label: "Spa Perks",
    test: (perks) =>
      received(perks, "spa", (d) => d.spa_type !== "Nothing"),
  },
  {
    key: "fnb_credit",
    label: "F&B Credit",
    test: (perks) => received(perks, "fnb_credit"),
  },
  {
    key: "welcome_gift",
    label: "Welcome Gift",
    test: (perks) =>
      received(perks, "gift", (d) => d.gift_type !== "Nothing"),
  },
  {
    key: "good_wifi",
    label: "Good WiFi",
    test: (perks) =>
      received(
        perks,
        "wifi",
        (d) =>
          d.speed === "Excellent (50+ Mbps)" || d.speed === "Good (20-50 Mbps)" ||
          String(d.speed).startsWith("Excellent") || String(d.speed).startsWith("Good"),
      ),
  },
  {
    key: "pool_open",
    label: "Pool Open",
    test: (perks) =>
      received(perks, "pool", (d) => d.pool_open === "Yes"),
  },
  {
    key: "great_staff",
    label: "Great Staff",
    test: (perks) =>
      received(
        perks,
        "staff_service",
        (d) => typeof d.honors_status === "string" && d.honors_status.startsWith("Yes"),
      ),
  },
];

/* ------------------------------------------------------------------ */
/*  Luxury brands for the Ambassador row                              */
/* ------------------------------------------------------------------ */

const LUXURY_BRANDS = new Set([
  "The Ritz-Carlton",
  "St. Regis",
  "W Hotels",
  "EDITION",
  "The Luxury Collection",
  "JW Marriott",
]);

/* ------------------------------------------------------------------ */
/*  Home page                                                         */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { hotels, perkCounts, scores, hotelPerks, isLoading } = useHotels();
  const { isFollowed, isBusy, toggle } = useFollow(user?.id);

  /* --- State -------------------------------------------------------- */
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [brandFilter, setBrandFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [perkFilter, setPerkFilter] = useState<string[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [showAll, setShowAll] = useState(false);

  // Modal states
  const [showAuth, setShowAuth] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showReqHotel, setShowReqHotel] = useState(false);
  const [reqHotelSeed, setReqHotelSeed] = useState("");

  /* --- Derived: unique regions -------------------------------------- */
  const regions = useMemo(() => {
    const set = new Set<string>();
    hotels.forEach((h) => {
      if (h.region) set.add(h.region);
    });
    return Array.from(set).sort();
  }, [hotels]);

  /* --- Filter toggle ------------------------------------------------ */
  const togglePerkFilter = useCallback(
    (key: string) => {
      setPerkFilter((prev) => {
        const next = prev.includes(key)
          ? prev.filter((k) => k !== key)
          : [...prev, key];
        return next;
      });
      setPageNum(1);
    },
    [],
  );

  /* --- Has any filter active? --------------------------------------- */
  const hasFilters =
    !!debouncedSearch.trim() ||
    !!brandFilter ||
    !!regionFilter ||
    perkFilter.length > 0;

  /* --- Filtered + sorted hotels ------------------------------------- */
  const filtered = useMemo(() => {
    let list = hotels;

    // Text search
    if (debouncedSearch.trim()) {
      const words = debouncedSearch
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0);
      list = list.filter((h) => {
        const hay = [
          h.name,
          h.location,
          h.region || "",
          h.brand,
          h.country || "",
        ]
          .join(" ")
          .toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }

    // Brand filter
    if (brandFilter) {
      list = list.filter((h) => h.brand === brandFilter);
    }

    // Region filter
    if (regionFilter) {
      list = list.filter((h) => h.region === regionFilter);
    }

    // Perk filters
    if (perkFilter.length > 0) {
      list = list.filter((h) => {
        const hp = hotelPerks[h.id];
        return perkFilter.every((key) => {
          const def = PERK_FILTERS.find((f) => f.key === key);
          return def ? def.test(hp) : true;
        });
      });
    }

    // Sort: score desc, perkCount desc, name asc
    list = [...list].sort((a, b) => {
      const sa = scores[a.id] || 0;
      const sb = scores[b.id] || 0;
      if (sb !== sa) return sb - sa;
      const ca = perkCounts[a.id] || 0;
      const cb = perkCounts[b.id] || 0;
      if (cb !== ca) return cb - ca;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [hotels, debouncedSearch, brandFilter, regionFilter, perkFilter, hotelPerks, scores, perkCounts]);

  // Reset page on filter change
  useMemo(() => {
    setPageNum(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, brandFilter, regionFilter, perkFilter.length]);

  /* --- Pagination --------------------------------------------------- */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedHotels = filtered.slice(
    (pageNum - 1) * PAGE_SIZE,
    pageNum * PAGE_SIZE,
  );

  /* --- Stats -------------------------------------------------------- */
  const totalReports = useMemo(
    () => Object.values(perkCounts).reduce((a, b) => a + b, 0),
    [perkCounts],
  );
  const hotelsWithData = useMemo(
    () => Object.keys(perkCounts).length,
    [perkCounts],
  );

  /* --- Curated rows (Netflix-style) --------------------------------- */
  const curatedRows = useMemo(() => {
    if (hasFilters) return [];

    const rows: {
      title: string;
      subtitle: string;
      hotels: Hotel[];
    }[] = [];

    const MIN = 3;

    // 1. Top Rated Properties
    const topRated = hotels
      .filter((h) => (scores[h.id] || 0) >= 40)
      .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
      .slice(0, 20);
    if (topRated.length >= MIN) {
      rows.push({
        title: "Top Rated Properties",
        subtitle: "Highest community perk scores across all brands",
        hotels: topRated,
      });
    }

    // 2. Best for Ambassador & Titanium Elite
    const luxuryHotels = hotels
      .filter((h) => LUXURY_BRANDS.has(h.brand))
      .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
      .slice(0, 20);
    if (luxuryHotels.length >= MIN) {
      rows.push({
        title: "Best for Ambassador & Titanium Elite",
        subtitle: "Luxury brands: Ritz-Carlton, St. Regis, W, EDITION, Luxury Collection, JW Marriott",
        hotels: luxuryHotels,
      });
    }

    // 3. Free Breakfast Confirmed
    const breakfastDef = PERK_FILTERS.find((f) => f.key === "free_breakfast")!;
    const breakfastHotels = hotels
      .filter((h) => breakfastDef.test(hotelPerks[h.id]))
      .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
      .slice(0, 20);
    if (breakfastHotels.length >= MIN) {
      rows.push({
        title: "Free Breakfast Confirmed",
        subtitle: "Hotels where guests report complimentary breakfast for elites",
        hotels: breakfastHotels,
      });
    }

    // 4. Lounge Access Available
    const loungeDef = PERK_FILTERS.find((f) => f.key === "lounge_open")!;
    const loungeHotels = hotels
      .filter((h) => loungeDef.test(hotelPerks[h.id]))
      .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
      .slice(0, 20);
    if (loungeHotels.length >= MIN) {
      rows.push({
        title: "Lounge Access Available",
        subtitle: "Properties with open executive lounges reported by guests",
        hotels: loungeHotels,
      });
    }

    // 5. Suite Upgrade Friendly
    const upgradeDef = PERK_FILTERS.find((f) => f.key === "suite_upgrade")!;
    const upgradeHotels = hotels
      .filter((h) => upgradeDef.test(hotelPerks[h.id]))
      .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
      .slice(0, 20);
    if (upgradeHotels.length >= MIN) {
      rows.push({
        title: "Suite Upgrade Friendly",
        subtitle: "Hotels where elite guests have received room upgrades",
        hotels: upgradeHotels,
      });
    }

    // 6. Late Checkout Champions
    const lcoDef = PERK_FILTERS.find((f) => f.key === "late_checkout")!;
    const lcoHotels = hotels
      .filter((h) => lcoDef.test(hotelPerks[h.id]))
      .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
      .slice(0, 20);
    if (lcoHotels.length >= MIN) {
      rows.push({
        title: "Late Checkout Champions",
        subtitle: "Properties that honor late checkout requests",
        hotels: lcoHotels,
      });
    }

    // 7. Most Reported
    const mostReported = [...hotels]
      .filter((h) => (perkCounts[h.id] || 0) > 0)
      .sort((a, b) => (perkCounts[b.id] || 0) - (perkCounts[a.id] || 0))
      .slice(0, 20);
    if (mostReported.length >= MIN) {
      rows.push({
        title: "Most Reported",
        subtitle: "Hotels with the most community perk reports",
        hotels: mostReported,
      });
    }

    // 8. Recently Reported
    const recentlyReported = [...hotels]
      .filter((h) => hotelPerks[h.id]?.length > 0)
      .sort((a, b) => {
        const aPerks = hotelPerks[a.id] || [];
        const bPerks = hotelPerks[b.id] || [];
        const aLatest = Math.max(
          ...aPerks.map((p) => toTimestamp(p.created_at)),
          0,
        );
        const bLatest = Math.max(
          ...bPerks.map((p) => toTimestamp(p.created_at)),
          0,
        );
        return bLatest - aLatest;
      })
      .slice(0, 20);
    if (recentlyReported.length >= MIN) {
      rows.push({
        title: "Recently Reported",
        subtitle: "Hotels with the latest community activity",
        hotels: recentlyReported,
      });
    }

    // 9-11. Regional rows -- top 3 regions by total reports
    const regionCounts: Record<string, number> = {};
    hotels.forEach((h) => {
      if (h.region) {
        regionCounts[h.region] =
          (regionCounts[h.region] || 0) + (perkCounts[h.id] || 0);
      }
    });
    const topRegions = Object.entries(regionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([r]) => r);

    topRegions.forEach((region) => {
      const regionHotels = hotels
        .filter((h) => h.region === region)
        .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
        .slice(0, 20);
      if (regionHotels.length >= MIN) {
        rows.push({
          title: `Popular in ${region}`,
          subtitle: `Top-rated properties in the ${region} region`,
          hotels: regionHotels,
        });
      }
    });

    return rows;
  }, [hotels, scores, perkCounts, hotelPerks, hasFilters]);

  /* --- Navigation helpers ------------------------------------------- */
  const navigateToHotel = useCallback(
    (hotel: Hotel) => {
      router.push(`/hotel/${hotel.slug}`);
    },
    [router],
  );

  const handleAuthClick = useCallback(() => {
    if (user) {
      // Sign out via the auth hook -- we just open auth modal to handle it
      // The Header component handles sign out directly via its own logic
      // For simplicity, toggle the auth modal
    }
    setShowAuth(true);
  }, [user]);

  const handleToggleFollow = useCallback(
    (hotelId: string, _following: boolean) => {
      if (!user) {
        setShowAuth(true);
        return;
      }
      toggle(hotelId);
    },
    [user, toggle],
  );

  const handleRequestHotel = useCallback((name: string) => {
    setReqHotelSeed(name);
    setShowAdd(false);
    setShowReqHotel(true);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ============================================================ */}
      {/*  Dark header section                                         */}
      {/* ============================================================ */}
      <div className="bg-slate-900 pb-10">
        <Header
          user={user}
          isAdmin={isAdmin}
          onAuthClick={() => setShowAuth(true)}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setShowAll(true);
          }}
        />

        <div className="mx-auto max-w-[1100px] px-7 pt-10">
          {/* Hero text */}
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight text-white sm:text-5xl">
            Titanium, Platinum, Ambassador
            <br />
            Elite Perks & Benefits
          </h1>
          <p className="mt-4 max-w-[600px] text-[15px] leading-relaxed text-slate-400">
            Real Marriott Bonvoy elite benefits crowdsourced from real guests.
            Search any property to see what perks elites actually receive.
          </p>

          {/* Stats row */}
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div>
              <span className="text-2xl font-bold text-white">
                {totalReports.toLocaleString()}
              </span>
              <span className="ml-1.5 text-xs text-slate-400">
                perk reports
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">
                {hotelsWithData.toLocaleString()}
              </span>
              <span className="ml-1.5 text-xs text-slate-400">
                hotels with data
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">
                {hotels.length.toLocaleString()}
              </span>
              <span className="ml-1.5 text-xs text-slate-400">
                total properties
              </span>
            </div>
          </div>

          {/* Search + filters */}
          <div className="mt-7 flex flex-wrap gap-3">
            {/* Search input */}
            <div className="relative min-w-[240px] flex-[2_1_240px]">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.trim()) setShowAll(true);
                }}
                placeholder="Search by hotel name, city, brand, or country..."
                aria-label="Search hotels"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-slate-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent text-lg leading-none text-slate-400 hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Brand select */}
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setShowAll(true);
              }}
              aria-label="Filter by brand"
              className="min-w-[160px] flex-[1_1_160px] rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-3 text-sm text-slate-200 outline-none"
            >
              <option value="">All Brands</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Region select */}
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setShowAll(true);
              }}
              aria-label="Filter by region"
              className="min-w-[160px] flex-[1_1_160px] rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-3 text-sm text-slate-200 outline-none"
            >
              <option value="">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Perk filter chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {PERK_FILTERS.map((f) => {
              const active = perkFilter.includes(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => {
                    togglePerkFilter(f.key);
                    setShowAll(true);
                  }}
                  className={[
                    "rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-all",
                    active
                      ? "border-white bg-white text-slate-900"
                      : "border-slate-600 bg-transparent text-slate-400 hover:border-slate-400 hover:text-slate-200",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              );
            })}
            {perkFilter.length > 0 && (
              <button
                onClick={() => {
                  setPerkFilter([]);
                  setPageNum(1);
                }}
                className="rounded-full border border-red-400/30 bg-transparent px-3 py-1.5 text-[11px] font-semibold text-red-300 transition-colors hover:border-red-400 hover:text-red-200"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Content area                                                */}
      {/* ============================================================ */}
      <div className="mx-auto max-w-[1100px] px-7 py-8">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            {/* ------------------------------------------------------- */}
            {/*  No filters active: show curated rows                   */}
            {/* ------------------------------------------------------- */}
            {!hasFilters && !showAll && curatedRows.length > 0 && (
              <>
                {curatedRows.map((row, i) => (
                  <HotelRow
                    key={i}
                    title={row.title}
                    subtitle={row.subtitle}
                    hotels={row.hotels}
                    perkCounts={perkCounts}
                    scores={scores}
                    onSelect={navigateToHotel}
                    user={user}
                    isFollowing={(id) => isFollowed(id)}
                    onToggleFollow={(id, following) =>
                      handleToggleFollow(id, following)
                    }
                    isFollowBusy={(id) => isBusy(id)}
                  />
                ))}

                {/* Browse all button */}
                <div className="mt-4 mb-6 text-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="rounded-lg border border-slate-200 bg-white px-7 py-3 text-sm font-bold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    Browse all {hotels.length.toLocaleString()} properties
                  </button>
                </div>
              </>
            )}

            {/* ------------------------------------------------------- */}
            {/*  Show all grid (browseAll or filters active)            */}
            {/* ------------------------------------------------------- */}
            {(showAll || hasFilters) && (
              <>
                {/* Results count */}
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {filtered.length.toLocaleString()} hotel
                    {filtered.length !== 1 ? "s" : ""} found
                    {hasFilters ? " matching your filters" : ""}
                  </p>
                  {showAll && !hasFilters && (
                    <button
                      onClick={() => setShowAll(false)}
                      className="text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-900"
                    >
                      Show curated rows
                    </button>
                  )}
                </div>

                {/* Empty state */}
                {filtered.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
                    <div className="mb-3 text-4xl">&#x1F3E8;</div>
                    <p className="text-lg font-semibold text-slate-700">
                      No hotels found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try adjusting your search or filters.
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setSearch("");
                          setBrandFilter("");
                          setRegionFilter("");
                          setPerkFilter([]);
                        }}
                        className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Clear all filters
                      </button>
                      <button
                        onClick={() => {
                          if (!user) {
                            setShowAuth(true);
                            return;
                          }
                          setReqHotelSeed(search);
                          setShowReqHotel(true);
                        }}
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                      >
                        Request a hotel
                      </button>
                    </div>
                  </div>
                )}

                {/* Hotel grid */}
                {pagedHotels.length > 0 && (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                    {pagedHotels.map((h) => (
                      <HotelCard
                        key={h.id}
                        hotel={h}
                        perkCount={perkCounts[h.id] || 0}
                        score={scores[h.id] || 0}
                        onClick={() => navigateToHotel(h)}
                        isFollowing={isFollowed(h.id)}
                        onToggleFollow={() =>
                          handleToggleFollow(h.id, isFollowed(h.id))
                        }
                        isFollowBusy={isBusy(h.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      current={pageNum}
                      total={totalPages}
                      onChange={(p) => {
                        setPageNum(p);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Modals                                                      */}
      {/* ============================================================ */}
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onAuth={() => setShowAuth(false)}
      />

      <AddPerkModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        user={user}
        hotels={hotels}
        onSelect={navigateToHotel}
        onRequestHotel={handleRequestHotel}
      />

      <RequestHotelModal
        open={showReqHotel}
        onClose={() => setShowReqHotel(false)}
        user={user}
        initialName={reqHotelSeed}
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
