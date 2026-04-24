import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import {
  ArrowRight,
  Flame,
  Gauge,
  ListChecks,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
      .select(
        "full_name, email, xp_total, current_streak, longest_streak, last_active_date"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("practice_attempts")
      .select(
        "id, is_correct, time_taken_seconds, question_id, questions(topic_id, topics(name, chapters(name, subjects(name))))"
      )
      .eq("user_id", user.id),
    supabase
      .from("practice_sessions")
      .select(
        "id, started_at, ended_at, total_questions, correct_count, total_time_seconds, topics(name), chapters(name), subjects(name)"
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(5),
  ])

  const profile = profileRes.data
  const attempts = (attemptsRes.data ?? []) as unknown as Array<{
    id: string
    is_correct: boolean | null
    time_taken_seconds: number
    question_id: string
    questions?: {
      topic_id: string
      topics?: {
        name?: string
        chapters?: { name?: string; subjects?: { name?: string } | null } | null
      } | null
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
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null
  const totalPracticeSeconds = attempts.reduce(
    (s, a) => s + (a.time_taken_seconds ?? 0),
    0
  )

  // Weak areas: group by topic_id, include those with ≥5 attempts and <50% accuracy.
  type Bucket = {
    topicId: string
    topicName: string
    crumb: string
    attempted: number
    correct: number
  }
  const byTopic = new Map<string, Bucket>()
  for (const a of attempts) {
    const topicId = a.questions?.topic_id
    if (!topicId) continue
    let b = byTopic.get(topicId)
    if (!b) {
      const topicName = a.questions?.topics?.name ?? "—"
      const crumb = [
        a.questions?.topics?.chapters?.subjects?.name,
        a.questions?.topics?.chapters?.name,
      ]
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
    .sort(
      (a, b) => a.correct / a.attempted - b.correct / b.attempted
    )
    .slice(0, 3)

  const greeting =
    profile?.full_name?.trim() || profile?.email?.split("@")[0] || "there"
  const streak = profile?.current_streak ?? 0
  const xp = profile?.xp_total ?? 0

  const isOnboarding = totalAttempts === 0

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {greeting}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isOnboarding
              ? "Let's get your first session on the board."
              : "Keep the momentum going."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={streak > 0 ? "default" : "outline"}
            className={cn(
              "gap-1 px-2.5 py-1 text-sm",
              streak > 0 && "bg-amber-500 hover:bg-amber-500 text-white"
            )}
          >
            <Flame className="size-3.5" />
            {streak > 0 ? `${streak}-day streak` : "Start your streak"}
          </Badge>
          <Badge variant="secondary" className="gap-1 px-2.5 py-1 text-sm">
            <Trophy className="size-3.5" />
            {xp} XP
          </Badge>
        </div>
      </div>

      {isOnboarding ? (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-4 text-primary" />
              Start your first practice session
            </CardTitle>
            <CardDescription>
              Each question forces you to commit to an approach before you
              see the answer — that&apos;s the point. You learn how you
              reason, not just whether you got it right.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/practice" />}>
              <Play /> Begin practicing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <MiniStat
              icon={ListChecks}
              label="Questions attempted"
              value={String(totalAttempts)}
            />
            <MiniStat
              icon={Gauge}
              label="Overall accuracy"
              value={
                overallAccuracy != null ? `${overallAccuracy}%` : "—"
              }
            />
            <MiniStat
              icon={Timer}
              label="Time practised"
              value={fmt(totalPracticeSeconds)}
            />
          </section>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-4 text-primary" />
                Jump back in
              </CardTitle>
              <CardDescription>
                Pick a subject, commit to an approach, get instant
                reasoning-first feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href="/practice" />}>
                <Play /> Continue practising
                <ArrowRight className="ml-1" />
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      <section className="grid gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <TrendingDown className="size-3.5" />
          Your weak areas
        </h2>
        {weak.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Practise more to see insights here — we need at least 5 attempts
            per topic to surface patterns.
          </div>
        ) : (
          <div className="grid gap-2">
            {weak.map((w) => {
              const pct = Math.round((w.correct / w.attempted) * 100)
              return (
                <div
                  key={w.topicId}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{w.topicName}</div>
                    <div className="text-xs text-muted-foreground">
                      {w.crumb}
                    </div>
                  </div>
                  <Badge variant="destructive">{pct}%</Badge>
                  <span className="text-xs text-muted-foreground">
                    {w.correct}/{w.attempted}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent sessions
        </h2>
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No sessions yet.
          </div>
        ) : (
          <div className="grid gap-2">
            {sessions.map((s) => {
              const scope =
                s.topics?.name || s.chapters?.name || s.subjects?.name || "Mixed"
              const accuracy =
                s.total_questions > 0
                  ? Math.round((s.correct_count / s.total_questions) * 100)
                  : null
              const ago = formatDistanceToNowStrict(new Date(s.started_at), {
                addSuffix: true,
              })
              const inProgress = s.ended_at == null
              const href = inProgress
                ? `/practice/session/${s.id}`
                : `/practice/session/${s.id}/summary`
              return (
                <Link
                  key={s.id}
                  href={href}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{scope}</span>
                      {inProgress ? (
                        <Badge variant="outline">In progress</Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">{ago}</div>
                  </div>
                  {accuracy != null ? (
                    <Badge
                      variant={
                        accuracy >= 70
                          ? "default"
                          : accuracy >= 40
                            ? "secondary"
                            : "destructive"
                      }
                      className={cn(
                        accuracy >= 70 && "bg-emerald-600 hover:bg-emerald-600"
                      )}
                    >
                      {accuracy}%
                    </Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {s.correct_count}/{s.total_questions}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <Icon className="mt-0.5 size-4 text-muted-foreground" />
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
