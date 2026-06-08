"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/hotels", label: "Hotels" },
  { href: "/brands", label: "Brands" },
  { href: "/hiscores", label: "Hiscores" },
  { href: "/contact", label: "Contact" },
];

const REDDIT = "https://www.reddit.com/r/marriott/";

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-5">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="font-display text-2xl font-semibold tracking-tight text-ink"
        >
          PerkSnob
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm text-ink-soft sm:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition-colors hover:text-ink">
              {n.label}
            </Link>
          ))}
          <a
            href={REDDIT}
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
              <button onClick={handleSignOut} className="transition-colors hover:text-ink">
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

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="text-ink sm:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <nav className="border-t border-line px-6 py-3 sm:hidden">
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block py-2.5 text-ink-soft transition-colors hover:text-ink"
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={REDDIT}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block py-2.5 text-ink-soft transition-colors hover:text-ink"
              >
                r/Marriott
              </a>
            </li>
            {user ? (
              <>
                <li>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="block py-2.5 text-ink-soft transition-colors hover:text-ink"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleSignOut}
                    className="block w-full py-2.5 text-left text-ink-soft transition-colors hover:text-ink"
                  >
                    Sign out
                  </button>
                </li>
              </>
            ) : (
              <li className="pt-2">
                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="inline-block rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper"
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
