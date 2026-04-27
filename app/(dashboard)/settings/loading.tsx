export default function SettingsLoading() {
  return (
    <div className="grid gap-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-24 rounded-lg bg-muted" />
        <div className="mt-1 h-4 w-48 rounded-lg bg-muted" />
      </div>

      {/* Profile section */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="h-5 w-20 rounded bg-muted mb-5" />
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-3 w-24 rounded bg-muted mb-2" />
              <div className="h-11 w-full rounded-xl bg-muted" />
            </div>
          ))}
          <div className="h-11 w-32 rounded-xl bg-muted mt-2" />
        </div>
      </div>

      {/* Account section */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="h-5 w-20 rounded bg-muted mb-5" />
        <div className="flex gap-3">
          <div className="h-10 w-36 rounded-xl bg-muted" />
          <div className="h-10 w-24 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Data section */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="h-5 w-16 rounded bg-muted mb-4" />
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
