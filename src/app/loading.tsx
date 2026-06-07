export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Title skeleton */}
          <div className="h-12 w-60 animate-pulse rounded-lg bg-slate-200" />

          {/* Tagline skeleton */}
          <div className="mt-4 h-6 w-80 animate-pulse rounded-md bg-slate-200" />

          {/* Search bar skeleton */}
          <div className="mt-10 h-14 w-full max-w-xl animate-pulse rounded-xl bg-slate-200" />

          {/* Stat skeleton */}
          <div className="mt-12 h-10 w-40 animate-pulse rounded-md bg-slate-200" />
        </div>
      </div>
    </main>
  );
}
