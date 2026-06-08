import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import HotelInfoBar from "@/components/hotel/HotelInfoBar";
import ClaimUnlocks from "@/components/hotel/ClaimUnlocks";
import InviteAccept from "@/components/claim/InviteAccept";
import {
  createServerSupabase,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import type { Hotel } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claim your hotel — PerkSnob invitation",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-14">{children}</div>
      <Footer />
    </main>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-12 text-center">
      <p className="font-display text-2xl font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-prose text-ink-soft">{body}</p>
      <Link
        href="/"
        className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent"
      >
        Go to PerkSnob →
      </Link>
    </div>
  );
}

export default async function ClaimInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!UUID_RE.test(token)) {
    return (
      <Shell>
        <Notice
          title="Invalid invitation"
          body="This invitation link doesn't look right. Please use the exact link from your email."
        />
      </Shell>
    );
  }

  let svc;
  try {
    svc = await createServiceRoleClient();
  } catch {
    return (
      <Shell>
        <Notice
          title="Something went wrong"
          body="We couldn't load your invitation. Please try again shortly."
        />
      </Shell>
    );
  }

  const { data: invite } = await svc
    .from("hotel_invites")
    .select("token, hotel_id, email, expires_at, accepted_at, accepted_by")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <Shell>
        <Notice
          title="Invitation not found"
          body="This invitation link is invalid or has been retired. Contact us and we'll send a fresh one."
        />
      </Shell>
    );
  }

  const {
    data: { user },
  } = await (await createServerSupabase()).auth.getUser();

  if (invite.accepted_at) {
    const mine = !!user && invite.accepted_by === user.id;
    return (
      <Shell>
        <Notice
          title="This profile is already claimed"
          body={
            mine
              ? "You've already claimed this hotel. Head to your dashboard to manage it."
              : "Someone has already claimed this hotel profile. If that wasn't authorized, contact us."
          }
        />
        {mine && (
          <div className="mt-5 text-center">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-accent hover:underline"
            >
              Go to your dashboard →
            </Link>
          </div>
        )}
      </Shell>
    );
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return (
      <Shell>
        <Notice
          title="Invitation expired"
          body="This invitation has expired. Contact us and we'll send you a new link."
        />
      </Shell>
    );
  }

  const { data: hotel } = await svc
    .from("hotels")
    .select("*")
    .eq("id", invite.hotel_id)
    .maybeSingle<Hotel>();

  if (!hotel) {
    return (
      <Shell>
        <Notice
          title="Hotel not found"
          body="We couldn't find the hotel for this invitation."
        />
      </Shell>
    );
  }

  const { count: reportCount } = await svc
    .from("perk_reports")
    .select("*", { count: "exact", head: true })
    .eq("hotel_id", hotel.id);

  const country =
    hotel.country && !hotel.location.includes(hotel.country)
      ? ` · ${hotel.country}`
      : "";

  return (
    <Shell>
      <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
        You&rsquo;re invited
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
        Claim {hotel.name}
      </h1>
      <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-soft">
        Your hotel already has a profile on PerkSnob — the free Marriott Bonvoy
        elite-benefits directory built by the r/marriott community. Accept this invitation to
        publish your official elite perks and earn the verified badge.
      </p>

      {/* Pre-filled identity card */}
      <div className="mt-8 rounded-xl border border-line bg-paper-raised p-6">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          {hotel.brand}
        </p>
        <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight">
          {hotel.name}
        </p>
        <p className="mt-1 text-ink-soft">
          {hotel.location}
          {country}
        </p>
        <HotelInfoBar hotel={hotel} />
        <p className="mt-5 border-t border-line pt-4 text-sm text-ink-soft">
          We&rsquo;ve already set up your profile
          {typeof reportCount === "number" && reportCount > 0
            ? ` with ${reportCount} guest report${reportCount === 1 ? "" : "s"}`
            : ""}
          . Claiming lets you confirm it&rsquo;s accurate and add your official perks.
        </p>
      </div>

      {/* Accept */}
      <div className="mt-6">
        <InviteAccept
          token={token}
          hotelName={hotel.name}
          hotelEmail={invite.email ?? ""}
          signedIn={!!user}
        />
      </div>

      {/* Why claim */}
      <ClaimUnlocks
        hotelName={hotel.name}
        heading="Why claim your profile"
        subtext="It's free, forever. Here's what claiming unlocks:"
        showCta={false}
      />
    </Shell>
  );
}
