export default function ReferralLoading() {
  return (
    <div className="grid gap-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-32 rounded-lg bg-muted" />
        <div className="mt-1 h-4 w-56 rounded-lg bg-muted" />
      </div>

      {/* Referral link card */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="h-4 w-28 rounded bg-muted mb-4" />
        <div className="flex gap-2">
          <div className="flex-1 h-11 rounded-xl bg-muted" />
          <div className="h-11 w-20 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="h-6 w-12 rounded bg-muted mb-1" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Referrals list */}
      <div>
        <div className="h-4 w-32 rounded bg-muted mb-3" />
        <div className="grid gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 min-h-[56px]">
              <div className="size-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-28 rounded bg-muted mb-1" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
