import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import {
  ArrowRight,
  Flame,
  Play,
  Sparkles,
  Timer,
  TrendingDown,
  Trophy,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

function fmt(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  const s = Math.floor(total % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default async function DashboardHomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, attemptsRes, sessionsRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("full_name, email, xp_total, current_streak, longest_streak, last_active_date")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("practice_attempts")
      .select("id, is_correct, time_taken_seconds, question_id, questions(topic_id, topics(name, chapters(name, subjects(name))))")
      .eq("user_id", user.id),
    supabase
      .from("practice_sessions")
      .select("id, started_at, ended_at, total_questions, correct_count, total_time_seconds, topics(name), chapters(name), subjects(name)")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(3),
  ])

  const profile = profileRes.data
  const attempts = (attemptsRes.data ?? []) as unknown as Array<{
    id: string
    is_correct: boolean | null
    time_taken_seconds: number
    question_id: string
    questions?: {
      topic_id: string
      topics?: { name?: string; chapters?: { name?: string; subjects?: { name?: string } | null } | null } | null
    } | null
  }>
  const sessions = (sessionsRes.data ?? []) as unknown as Array<{
    id: string
    started_at: string
    ended_at: string | null
    total_questions: number
    correct_count: number
    total_time_seconds: number
    topics?: { name?: string } | null
    chapters?: { name?: string } | null
    subjects?: { name?: string } | null
  }>

  const totalAttempts = attempts.length
  const totalCorrect = attempts.filter((a) => a.is_correct === true).length
  const totalPracticeSeconds = attempts.reduce((s, a) => s + (a.time_taken_seconds ?? 0), 0)

  // Weak areas
  type Bucket = { topicId: string; topicName: string; crumb: string; attempted: number; correct: number }
  const byTopic = new Map<string, Bucket>()
  for (const a of attempts) {
    const topicId = a.questions?.topic_id
    if (!topicId) continue
    let b = byTopic.get(topicId)
    if (!b) {
      const topicName = a.questions?.topics?.name ?? "—"
      const crumb = [a.questions?.topics?.chapters?.subjects?.name, a.questions?.topics?.chapters?.name]
        .filter(Boolean)
        .join(" › ")
      b = { topicId, topicName, crumb, attempted: 0, correct: 0 }
      byTopic.set(topicId, b)
    }
    b.attempted++
    if (a.is_correct === true) b.correct++
  }
  const weak = Array.from(byTopic.values())
    .filter((b) => b.attempted >= 5 && b.correct / b.attempted < 0.5)
    .sort((a, b) => a.correct / a.attempted - b.correct / b.attempted)
    .slice(0, 6)

  // Extract first name for greeting
  const rawName = profile?.full_name?.trim() || user.email?.split("@")[0] || "there"
  const firstName = rawName.split(" ")[0]

  const streak = profile?.current_streak ?? 0
  const xp = profile?.xp_total ?? 0
  const isOnboarding = totalAttempts === 0

  return (
    <div className="grid gap-6">
      {/* ── Greeting row ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hey {firstName} 👋
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {isOnboarding ? "Let's start your first session." : "Keep the momentum going."}
        </p>
      </div>

      {/* ── Streak + XP compact row ── */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
            streak > 0
              ? "bg-accent-warm/15 text-amber-700"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Flame className={cn("size-4", streak > 0 ? "text-amber-500" : "text-muted-foreground")} />
          {streak > 0 ? `${streak}-day streak` : "No streak yet"}
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          <Trophy className="size-4" />
          {xp} XP
        </div>
      </div>

      {/* ── Primary CTA ── */}
      {isOnboarding ? (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-semibold">Start your first practice session</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Commit to an approach before you see the answer. You&apos;ll learn how you reason, not just whether you got it right.
          </p>
          <Button render={<Link href="/practice" />} className="w-full min-h-[48px]">
            <Play /> Begin practising
          </Button>
        </div>
      ) : (
        <Button render={<Link href="/practice" />} className="w-full min-h-[48px] text-base">
          <Play /> Continue practising
          <ArrowRight className="ml-auto" />
        </Button>
      )}

      {/* ── Stats row (non-onboarding) ── */}
      {!isOnboarding ? (
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Attempted" value={String(totalAttempts)} />
          <StatPill
            label="Accuracy"
            value={totalAttempts > 0 ? `${Math.round((totalCorrect / totalAttempts) * 100)}%` : "—"}
          />
          <StatPill label="Practised" value={fmt(totalPracticeSeconds)} />
        </div>
      ) : null}

      {/* ── Weak areas: horizontal chip scroll ── */}
      {weak.length > 0 ? (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingDown className="size-3.5" />
            Weak areas
          </h2>
          {/* horizontal scroll — no scrollbar visually, no backdrop-filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {weak.map((w) => {
              const pct = Math.round((w.correct / w.attempted) * 100)
              return (
                <div
                  key={w.topicId}
                  className="shrink-0 rounded-xl border bg-card px-3 py-2.5 min-w-[140px] max-w-[180px]"
                >
                  <p className="text-sm font-medium leading-snug">{w.topicName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{w.crumb}</p>
                  <Badge variant="destructive" className="mt-1.5 text-xs">
                    {pct}%
                  </Badge>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* ── Recent sessions ── */}
      {sessions.length > 0 ? (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent sessions
          </h2>
          <div className="grid gap-2">
            {sessions.map((s) => {
              const scope = s.topics?.name || s.chapters?.name || s.subjects?.name || "Mixed"
              const accuracy = s.total_questions > 0
                ? Math.round((s.correct_count / s.total_questions) * 100)
                : null
              const ago = formatDistanceToNowStrict(new Date(s.started_at), { addSuffix: true })
              const inProgress = s.ended_at == null
              const href = inProgress ? `/practice/session/${s.id}` : `/practice/session/${s.id}/summary`
              return (
                <Link
                  key={s.id}
                  href={href}
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 min-h-[56px] transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{scope}</span>
                      {inProgress ? <Badge variant="outline" className="text-xs">In progress</Badge> : null}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {s.correct_count}/{s.total_questions} correct · {ago}
                    </div>
                  </div>
                  {accuracy != null ? (
                    <Badge
                      variant={accuracy >= 70 ? "default" : accuracy >= 40 ? "secondary" : "destructive"}
                      className={cn(accuracy >= 70 && "bg-emerald-600 hover:bg-emerald-600")}
                    >
                      {accuracy}%
                    </Badge>
                  ) : null}
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* ── Time stat (non-onboarding) ── */}
      {!isOnboarding ? (
        <p className="text-center text-xs text-muted-foreground">
          <Timer className="inline size-3 mr-1" />
          {fmt(totalPracticeSeconds)} total practice time
        </p>
      ) : null}
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-3 text-center">
      <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}
