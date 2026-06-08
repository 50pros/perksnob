import Link from "next/link";
import { ClipboardCheck, BadgeCheck, BarChart3, Users } from "lucide-react";

const UNLOCKS = [
  {
    Icon: ClipboardCheck,
    title: "Publish your official perks",
    body: "Declare exactly what each elite tier gets — breakfast, lounge, upgrades, late checkout and more.",
  },
  {
    Icon: BadgeCheck,
    title: "Earn the Verified badge",
    body: "Stand apart from unclaimed listings with a hotel-confirmed profile elite travelers trust.",
  },
  {
    Icon: BarChart3,
    title: "Show your delivery score",
    body: "Turn guest confirmations into a public trust signal that rewards properties who actually deliver.",
  },
  {
    Icon: Users,
    title: "Reach Bonvoy's best guests",
    body: "Titanium, Platinum and Ambassador Elites — Marriott's highest-spend travelers — check here before they book.",
  },
];

/** Bottom-of-page closer on unclaimed hotels: the concrete value of claiming. */
export default function ClaimUnlocks({
  hotelName,
  heading,
  subtext,
  showCta = true,
}: {
  hotelName: string;
  heading?: string;
  subtext?: string;
  showCta?: boolean;
}) {
  return (
    <section className="mt-14 overflow-hidden rounded-2xl bg-ink p-8 text-paper sm:p-10">
      <p className="text-[13px] font-medium uppercase tracking-eyebrow text-paper/55">
        For hotels
      </p>
      <h2 className="mt-3 max-w-[24ch] font-display text-3xl font-semibold tracking-tight">
        {heading ?? `Claim ${hotelName} — free`}
      </h2>
      <p className="mt-3 max-w-prose text-paper/70">
        {subtext ??
          "Claiming takes about two minutes and is verified by a one-time email to the address already on file. Here's what it unlocks:"}
      </p>

      <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
        {UNLOCKS.map(({ Icon, title, body }) => (
          <div key={title} className="flex gap-3.5">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-paper/80" aria-hidden />
            <div>
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-paper/65">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {showCta && (
        <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href="/"
            className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent hover:text-paper"
          >
            Claim this hotel →
          </Link>
          <span className="text-sm text-paper/55">
            Free forever · no account games · ~2 minutes
          </span>
        </div>
      )}
    </section>
  );
}
