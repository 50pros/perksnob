import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { CATS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your dashboard",
  robots: { index: false },
};

interface DashHotel {
  id: string;
  name: string;
  slug: string;
  brand: string;
  location: string;
}

const catLabel = (k: string) => CATS.find((c) => c.key === k)?.label ?? k;
const tierLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function pick<T>(h: T | T[] | null): T | null {
  return Array.isArray(h) ? (h[0] ?? null) : h;
}

export default async function DashboardPage() {
  const supa = await createServerSupabase();
  const {
    data: { user },
  } = await supa.auth.getUser();

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-paper text-ink">
      <Header />
      <div className="mx-auto max-w-content px-6 py-16">{children}</div>
      <Footer />
    </main>
  );

  if (!user) {
    return shell(
      <div className="rounded-xl border border-dashed border-line p-12 text-center">
        <p className="font-display text-2xl font-semibold">Sign in to your dashboard</p>
        <p className="mt-2 text-ink-soft">
          See the perks you&rsquo;ve reported, the hotels you manage, and more.
        </p>
        <Link
          href="/signin"
          className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent"
        >
          Sign in →
        </Link>
      </div>,
    );
  }

  const [claimsRes, reportsRes, requestsRes] = await Promise.all([
    supa
      .from("hotel_claims")
      .select("hotel_id, hotels(id,name,slug,brand,location)")
      .eq("user_id", user.id)
      .eq("status", "verified"),
    supa
      .from("perk_reports")
      .select("id, category, elite_tier, description, hotels(name, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supa
      .from("hotel_requests")
      .select("hotel_name, city, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const hotels: DashHotel[] = (claimsRes.data ?? [])
    .map((c) =>
      pick((c as unknown as { hotels: DashHotel | DashHotel[] | null }).hotels),
    )
    .filter((h): h is DashHotel => !!h);

  type ReportRow = {
    id: string;
    category: string;
    elite_tier: string;
    description: string;
    hotels: { name: string; slug: string } | { name: string; slug: string }[] | null;
  };
  const reports = ((reportsRes.data ?? []) as ReportRow[]).map((r) => ({
    ...r,
    hotel: pick(r.hotels),
  }));

  type RequestRow = { hotel_name: string; city: string | null; status: string };
  const requests = (requestsRes.data ?? []) as RequestRow[];

  return shell(
    <>
      <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
        Your dashboard
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Welcome back
      </h1>

      {hotels.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Your properties
          </h2>
          <p className="mt-2 max-w-prose text-sm text-ink-soft">
            Turn on the perks you offer Bonvoy elites. Guests confirm what they actually
            receive — the gap is what builds trust.
          </p>
          <div className="mt-6">
            <DashboardClient hotels={hotels} userId={user.id} />
          </div>
        </section>
      )}

      {/* Your reports */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Your reports</h2>
          <p className="text-sm text-ink-soft">
            {reports.length} report{reports.length === 1 ? "" : "s"}
          </p>
        </div>
        {reports.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line p-10 text-center">
            <p className="font-medium">You haven&rsquo;t shared any reports yet.</p>
            <p className="mt-1 text-sm text-ink-soft">
              Visit a hotel and tell the community what elite perks you received.
            </p>
            <Link
              href="/hotels"
              className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent"
            >
              Browse hotels →
            </Link>
          </div>
        ) : (
          <ul>
            {reports.map((r) => (
              <li key={r.id} className="border-b border-line py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {r.hotel ? (
                      <Link href={`/hotel/${r.hotel.slug}`} className="hover:text-accent">
                        {r.hotel.name}
                      </Link>
                    ) : (
                      "A hotel"
                    )}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {catLabel(r.category)} · {tierLabel(r.elite_tier)}
                  </p>
                </div>
                {r.description && (
                  <p className="mt-1 max-w-prose text-sm text-ink-soft">{r.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Hotels you requested */}
      {requests.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Hotels you requested
          </h2>
          <ul className="mt-4">
            {requests.map((rq, i) => (
              <li
                key={`${rq.hotel_name}-${i}`}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3"
              >
                <span>
                  <span className="font-medium">{rq.hotel_name}</span>
                  {rq.city && <span className="ml-2 text-sm text-ink-soft">{rq.city}</span>}
                </span>
                <span className="rounded-full border border-line px-2.5 py-0.5 text-xs capitalize text-ink-soft">
                  {rq.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>,
  );
}
