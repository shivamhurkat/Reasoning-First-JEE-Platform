import { Calendar, Clock, Lock } from "lucide-react"

export const dynamic = "force-dynamic"

function getCountdownToMidnight(): string {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0)
  const ms = midnight.getTime() - now.getTime()
  const h = Math.floor(ms / (1000 * 60 * 60))
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${h}h ${m}m`
}

export default function DailyChallengePage() {
  const countdown = getCountdownToMidnight()

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Challenge</h1>
        <p className="text-sm text-muted-foreground">
          A fresh set of questions every day.
        </p>
      </div>

      {/* ── Coming soon card ── */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Calendar className="size-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Coming soon</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Daily challenges — 5 hand-picked questions per day with a leaderboard — are on the roadmap.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-4 py-2.5 text-sm">
          <Clock className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Resets in</span>
          <span className="font-semibold tabular-nums">{countdown}</span>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" />
          In the meantime, practise any topic in the Practice tab
        </p>
      </div>
    </div>
  )
}
