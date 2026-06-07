"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
      <div className="text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="mt-2 text-ink-soft">An unexpected error occurred.</p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
