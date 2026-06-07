import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight text-ink"
        >
          PerkSnob
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-ink-soft sm:flex">
          <Link href="/hotels" className="transition-colors hover:text-ink">Hotels</Link>
          <Link href="/brands" className="transition-colors hover:text-ink">Brands</Link>
          <Link href="/how-it-works" className="transition-colors hover:text-ink">How it works</Link>
          <Link href="/for-hotels" className="text-ink-soft/70 transition-colors hover:text-ink">For hotels</Link>
        </nav>
      </div>
    </header>
  );
}
