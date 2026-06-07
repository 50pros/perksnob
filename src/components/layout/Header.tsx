"use client";

import Link from "next/link";

interface HeaderProps {
  user: any;
  isAdmin: boolean;
  onAuthClick: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function Header({
  user,
  isAdmin,
  onAuthClick,
  search,
  onSearchChange,
}: HeaderProps) {
  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <header className="bg-slate-900 text-white">
      <div className="mx-auto max-w-[1100px] px-7 py-4">
        <div className="ps-header flex flex-wrap items-center justify-between gap-2">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-baseline gap-0.5 no-underline"
            aria-label="PerkSnob home"
          >
            <span className="font-serif text-4xl font-bold text-white">
              Perk
            </span>
            <span className="font-serif text-4xl font-bold text-slate-400">
              Snob
            </span>
          </Link>

          {/* Navigation */}
          <nav
            className="ps-nav flex items-center gap-0.5"
            aria-label="Main navigation"
          >
            <NavLink href="/compare">Compare</NavLink>
            <NavLink href="/leaderboard">Leaderboard</NavLink>
            {user && <NavLink href="/following">Following</NavLink>}
            {isAdmin && <NavLink href="/admin/requests">Admin</NavLink>}
          </nav>

          {/* Search + Auth */}
          <div className="ps-auth flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search 8,900+ properties..."
                aria-label="Search hotels"
                className="w-full min-w-[180px] rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-slate-500"
              />
              {search && (
                <button
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent p-0 text-lg leading-none text-slate-400 hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>

            {user ? (
              <>
                <span className="text-xs font-semibold text-slate-400">
                  {displayName}
                </span>
                <button
                  onClick={onAuthClick}
                  className="rounded-md border border-slate-600 bg-transparent px-3.5 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:border-slate-400 hover:text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="rounded-md border border-slate-600 bg-transparent px-3.5 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:border-slate-400 hover:text-white"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-4 py-2 text-[13px] font-semibold text-slate-400 no-underline transition-all hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  );
}
