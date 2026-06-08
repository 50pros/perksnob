"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/hotels", label: "Hotels" },
  { href: "/brands", label: "Brands" },
  { href: "/hiscores", label: "Hiscores" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

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
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition-colors hover:text-ink">
              {n.label}
            </Link>
          ))}
          <a
            href="https://www.reddit.com/r/marriott/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            r/Marriott
          </a>
          {user ? (
            <>
              <Link href="/dashboard" className="transition-colors hover:text-ink">
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="transition-colors hover:text-ink"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="rounded-full bg-ink px-4 py-1.5 font-medium text-paper transition-colors hover:bg-accent"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
