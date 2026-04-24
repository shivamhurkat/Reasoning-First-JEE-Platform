import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  Check,
  Clock,
  Gauge,
  Sparkles,
  X,
  Zap,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MathInlinePreview } from "@/components/math-preview"
import { endSession } from "@/app/(dashboard)/practice/actions"
import { APPROACHES, type ApproachId } from "@/lib/constants/practice"

export const dynamic = "force-dynamic"

function fmt(total: number): string {
  const m = Math.floor(total / 60)
  const s = Math.floor(total % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default async function SessionSummaryPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, user_id, started_at, ended_at, xp_earned, total_questions, correct_count, total_time_seconds, topic_id, chapter_id, subject_id, topics(name), chapters(name), subjects(name)")
    .eq("id", params.sessionId)
    .maybeSingle()
  if (!session || session.user_id !== user.id) notFound()

  let xpEarned = session.xp_earned ?? 0
  if (!session.ended_at) {
    const res = await endSession(session.id)
    if (res.ok) xpEarned = res.xpEarned
  }

  const { data: attemptsRaw } = await supabase
    .from("practice_attempts")
    .select("id, question_id, chosen_approach, is_correct, time_taken_seconds, attempted_at, questions(id, question_text, topic_id, topics(name, chapters(name, subjects(name))))")
    .eq("session_id", session.id)
    .order("attempted_at", { ascending: true })

  const attempts = (attemptsRaw ?? []) as unknown as Array<{
    id: string
    question_id: string
    chosen_approach: string | null
    is_correct: boolean | null
    time_taken_seconds: number
    questions?: {
      id: string
      question_text: string
      topics?: { name?: string; chapters?: { name?: string; subjects?: { name?: string } | null } | null } | null
    } | null
  }>

  const total = attempts.length
  const correct = attempts.filter((a) => a.is_correct === true).length
  const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 0
  const totalTime = attempts.reduce((s, a) => s + (a.time_taken_seconds ?? 0), 0)
  const avgTime = total > 0 ? Math.round(totalTime / total) : 0

  const approachCounts = new Map<ApproachId, number>()
  for (const a of attempts) {
    const id = (a.chosen_approach ?? "full_solve") as ApproachId
    approachCounts.set(id, (approachCounts.get(id) ?? 0) + 1)
  }

  const missed = attempts.filter((a) => a.is_correct === false)

  const scopeLabel =
    (session as unknown as { topics?: { name?: string } }).topics?.name ||
    (session as unknown as { chapters?: { name?: string } }).chapters?.name ||
    (session as unknown as { subjects?: { name?: string } }).subjects?.name ||
    "Mixed practice"

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-6 md:py-8">
      {/* ── Score headline ── */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{scopeLabel}</p>
        <div className="mt-2">
          <span className="text-5xl font-bold tabular-nums">
            {correct}
          </span>
          <span className="text-2xl text-muted-foreground">/{total}</span>
        </div>
        <p className="mt-1 text-sm font-medium text-muted-foreground">correct</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Session complete</h1>
      </div>

      {/* ── 2×2 stats grid — fills nicely on 380px ── */}
      <section className="mt-5 grid grid-cols-2 gap-2">
        <StatCard
          icon={Gauge}
          label="Accuracy"
          value={total > 0 ? `${accuracyPct}%` : "—"}
          tone={total === 0 ? "muted" : accuracyPct >= 70 ? "success" : accuracyPct >= 40 ? "warning" : "destructive"}
        />
        <StatCard icon={Clock} label="Total time" value={fmt(totalTime)} />
        <StatCard icon={Clock} label="Avg / question" value={total > 0 ? fmt(avgTime) : "—"} />
        <StatCard icon={Zap} label="XP earned" value={`+${xpEarned}`} tone="success" />
      </section>

      {/* ── Approach distribution ── */}
      <section className="mt-5 rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            How you approached it
          </h2>
        </div>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">No attempts this session.</p>
        ) : (
          <div className="grid gap-2">
            {APPROACHES.map((a) => {
              const n = approachCounts.get(a.id) ?? 0
              if (n === 0) return null
              const pct = total > 0 ? (n / total) * 100 : 0
              const Icon = a.icon
              return (
                <div key={a.id} className="flex items-center gap-2">
                  <div className="flex w-28 shrink-0 items-center gap-1.5 text-xs">
                    <Icon className="size-3 text-muted-foreground" />
                    <span className="truncate">{a.label}</span>
                  </div>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full transition-all", a.id === "skip" ? "bg-muted-foreground/40" : "bg-primary")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                    {n}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Missed questions ── */}
      <section className="mt-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Questions you missed
        </h2>
        {missed.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {total === 0 ? "No questions attempted." : "Perfect run — nothing missed 🎉"}
          </div>
        ) : (
          <div className="grid gap-2">
            {missed.map((a) => {
              const q = a.questions
              const tag = [q?.topics?.chapters?.subjects?.name, q?.topics?.chapters?.name, q?.topics?.name]
                .filter(Boolean)
                .join(" › ")
              return (
                <div key={a.id} className="flex min-h-[56px] items-start gap-3 rounded-xl border bg-card p-3">
                  <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">{tag}</div>
                    {q?.question_text ? (
                      <MathInlinePreview value={q.question_text} maxChars={120} className="mt-0.5 text-sm" />
                    ) : null}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {fmt(a.time_taken_seconds ?? 0)}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── CTAs — full-width on mobile ── */}
      <section className="mt-6 grid gap-2 sm:flex sm:flex-row">
        <Button render={<Link href="/practice" />} className="w-full min-h-[48px] sm:w-auto">
          <Check /> Continue practising
        </Button>
        <Button variant="outline" disabled className="w-full min-h-[48px] sm:w-auto">
          Review wrong answers (soon)
        </Button>
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone?: "default" | "success" | "warning" | "destructive" | "muted"
}) {
  const valueClass =
    tone === "success" ? "text-emerald-600"
    : tone === "warning" ? "text-amber-600"
    : tone === "destructive" ? "text-destructive"
    : tone === "muted" ? "text-muted-foreground"
    : "text-foreground"

  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className={cn("text-2xl font-bold tabular-nums", valueClass)}>{value}</div>
    </div>
  )
}
