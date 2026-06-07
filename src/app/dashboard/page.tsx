import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hotel dashboard",
  robots: { index: false },
};

interface DashHotel {
  id: string;
  name: string;
  slug: string;
  brand: string;
  location: string;
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
        <p className="font-display text-2xl font-semibold">Sign in to manage your hotel</p>
        <p className="mt-2 text-ink-soft">
          You need to be signed in to see your claimed properties.
        </p>
        <Link
          href="/for-hotels"
          className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent"
        >
          Go to claim flow →
        </Link>
      </div>,
    );
  }

  const { data: claims } = await supa
    .from("hotel_claims")
    .select("hotel_id, hotels(id,name,slug,brand,location)")
    .eq("user_id", user.id)
    .eq("status", "verified");

  const hotels: DashHotel[] = (claims ?? [])
    .map((c) => {
      const h = (c as unknown as { hotels: DashHotel | DashHotel[] | null }).hotels;
      return Array.isArray(h) ? (h[0] ?? null) : h;
    })
    .filter((h): h is DashHotel => !!h);

  if (hotels.length === 0) {
    return shell(
      <div className="rounded-xl border border-dashed border-line p-12 text-center">
        <p className="font-display text-2xl font-semibold">No verified properties yet</p>
        <p className="mt-2 text-ink-soft">
          Once you verify a claim from the hotel&rsquo;s on-file email, it&rsquo;ll appear
          here.
        </p>
        <Link
          href="/for-hotels"
          className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent"
        >
          Claim a property →
        </Link>
      </div>,
    );
  }

  return shell(
    <>
      <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
        Hotel dashboard
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Declare your elite perks
      </h1>
      <p className="mt-3 max-w-prose text-ink-soft">
        Turn on the perks you offer Bonvoy elites. Guests will confirm what they actually
        receive — the gap is what builds trust.
      </p>
      <div className="mt-8">
        <DashboardClient hotels={hotels} userId={user.id} />
      </div>
    </>,
  );
}
