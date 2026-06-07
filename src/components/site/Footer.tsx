import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-content px-6 py-10 text-sm text-ink-soft">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/hotels" className="transition-colors hover:text-ink">Hotels</Link>
          <Link href="/brands" className="transition-colors hover:text-ink">Brands</Link>
          <Link href="/how-it-works" className="transition-colors hover:text-ink">How it works</Link>
          <Link href="/for-hotels" className="transition-colors hover:text-ink">For hotels</Link>
        </div>
        <p className="mt-4 max-w-prose leading-relaxed">
          PerkSnob — a free, volunteer-led project from the Marriott Bonvoy community.
          Not affiliated with or endorsed by Marriott International.
        </p>
      </div>
    </footer>
  );
}
