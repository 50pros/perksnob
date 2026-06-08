import Link from "next/link";

/** Top-of-page conversion banner shown on unclaimed hotels. Leads with the
 *  social-proof hook (guests are already here) and the loss frame (they define
 *  your story until you claim). */
export default function ClaimBanner({
  hotelName,
  reportCount,
}: {
  hotelName: string;
  reportCount: number;
}) {
  return (
    <div className="rounded-xl border border-accent/30 bg-accent-soft p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          Unclaimed listing
        </p>
        <p className="mt-2 font-display text-xl font-semibold leading-snug tracking-tight">
          {reportCount > 0
            ? `${reportCount.toLocaleString("en-US")} guest report${reportCount === 1 ? "" : "s"} already describe ${hotelName} — but the hotel hasn't confirmed what it offers.`
            : `${hotelName} hasn't published its official elite benefits yet.`}
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
          Until you claim it, guests define your story. Take two minutes to declare exactly
          what every elite tier receives — it&rsquo;s free.
        </p>
      </div>
      <Link
        href="/for-hotels"
        className="mt-5 inline-block shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent sm:mt-0"
      >
        Claim this hotel →
      </Link>
    </div>
  );
}
