export default function CreditsLoading() {
  return (
    <div className="grid gap-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-32 rounded-lg bg-muted" />
        <div className="mt-1 h-4 w-48 rounded-lg bg-muted" />
      </div>

      {/* Balance card skeleton */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="h-4 w-24 rounded bg-muted mb-3" />
        <div className="h-10 w-28 rounded-lg bg-muted mb-2" />
        <div className="h-3 w-40 rounded bg-muted" />
      </div>

      {/* Package cards */}
      <div>
        <div className="h-4 w-32 rounded bg-muted mb-3" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="h-5 w-16 rounded bg-muted mb-2" />
              <div className="h-4 w-20 rounded bg-muted mb-3" />
              <div className="h-9 w-full rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history skeleton */}
      <div>
        <div className="h-4 w-36 rounded bg-muted mb-3" />
        <div className="grid gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 min-h-[56px]">
              <div className="size-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-muted mb-1" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="h-4 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
