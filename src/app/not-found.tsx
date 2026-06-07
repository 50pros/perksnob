import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
      <div className="text-center">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-ink-soft">That page doesn&rsquo;t exist or has moved.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
