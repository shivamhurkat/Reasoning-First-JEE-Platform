import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import {
  ArrowRight,
  BookOpen,
  Flame,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import {
  getMasteryData,
  getOverviewStats,
  getRecentSessions,
  type RecentSession,
  type SubjectMastery,
  type TopicMasteryBySubject,
  type WeakTopic,
} from "@/lib/queries/progress"
import {
  startSession,
} from "@/app/(dashboard)/practice/actions"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const dynamic = "force-dynamic"

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmtTime(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return m > 0 ? `${m}m` : "<1m"
}

function accuracyColor(pct: number): string {
  if (pct >= 70) return "text-emerald-600"
  if (pct >= 40) return "text-amber-600"
  return "text-red-600"
}

function accuracyBg(pct: number): string {
  if (pct >= 70) return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
  if (pct >= 40) return "bg-amber-500/10 text-amber-700 border-amber-500/30"
  return "bg-red-500/10 text-red-700 border-red-500/30"
}

const SUBJECT_BORDER: Record<string, string> = {
  physics: "border-l-[3px] border-l-[var(--subject-physics)]",
  chemistry: "border-l-[3px] border-l-[var(--subject-chemistry)]",
  mathematics: "border-l-[3px] border-l-[var(--subject-math)]",
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [overview, { subjectMastery, topicMastery, weakTopics }, recentSessions] =
    await Promise.all([
      getOverviewStats(user.id),
      getMasteryData(user.id),
      getRecentSessions(user.id, 10),
    ])

  const hasAnyData = overview.totalAttempted > 0

  return (
    <div className="grid gap-8 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Am I getting better?
        </p>
      </div>

      {/* ── Section 1: Overview stats ── */}
      <section>
        <SectionLabel>Overview</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<BookOpen className="size-4" />}
            label="Questions"
            value={String(overview.totalAttempted)}
          />
          <StatCard
            icon={<Target className="size-4" />}
            label="Accuracy"
            value={overview.accuracy != null ? `${overview.accuracy}%` : "—"}
            valueClass={
              overview.accuracy != null ? accuracyColor(overview.accuracy) : undefined
            }
          />
          <StatCard
            icon={<Timer className="size-4" />}
            label="Practice time"
            value={overview.totalTimeFormatted}
          />
          <StatCard
            icon={<Flame className="size-4" />}
            label="Streak"
            value={overview.currentStreak > 0 ? `${overview.currentStreak}d` : "—"}
            valueClass={overview.currentStreak > 0 ? "text-amber-600" : undefined}
          />
        </div>
      </section>

      {!hasAnyData ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Section 2: Subject mastery ── */}
          {subjectMastery.length > 0 ? (
            <section>
              <SectionLabel>Subject mastery</SectionLabel>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                {subjectMastery.map((sub) => (
                  <SubjectCard key={sub.id} subject={sub} />
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Section 3: Topic mastery accordion ── */}
          {topicMastery.length > 0 ? (
            <section>
              <SectionLabel>Topic breakdown</SectionLabel>
              <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                Sorted weakest first — focus here.
              </p>
              <TopicAccordion data={topicMastery} />
            </section>
          ) : null}

          {/* ── Section 4: Recent activity ── */}
          {recentSessions.length > 0 ? (
            <section>
              <SectionLabel>Recent sessions</SectionLabel>
              <div className="mt-3 grid gap-2">
                {recentSessions.map((s) => (
                  <RecentSessionRow key={s.id} session={s} />
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Section 5: Weak areas ── */}
          <section>
            <SectionLabel icon={<TrendingDown className="size-3.5" />}>
              Weak areas
            </SectionLabel>
            <WeakAreasSection weakTopics={weakTopics} />
          </section>
        </>
      )}
    </div>
  )
}

// ── Components ────────────────────────────────────────────────────────────────

function SectionLabel({
  children,
  icon,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {icon}
      {children}
    </h2>
  )
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3 min-h-[44px]">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}</div>
      <div>
        <p className={cn("text-xl font-bold tabular-nums leading-none", valueClass)}>
          {value}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}

function SubjectCard({ subject }: { subject: SubjectMastery }) {
  const borderClass =
    SUBJECT_BORDER[subject.slug] ?? "border-l-[3px] border-l-primary"

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 grid gap-3",
        borderClass
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-tight">{subject.name}</h3>
        {subject.accuracy != null ? (
          <Badge
            variant="outline"
            className={cn("text-xs shrink-0", accuracyBg(subject.accuracy))}
          >
            {subject.accuracy}%
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">
            No data
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      {subject.accuracy != null ? (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              subject.accuracy >= 70
                ? "bg-emerald-500"
                : subject.accuracy >= 40
                  ? "bg-amber-500"
                  : "bg-red-500"
            )}
            style={{ width: `${subject.accuracy}%` }}
          />
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {subject.attempted} question{subject.attempted !== 1 ? "s" : ""} attempted
      </p>

      {(subject.strongestTopic || subject.weakestTopic) ? (
        <div className="grid gap-1">
          {subject.strongestTopic ? (
            <p className="text-xs text-muted-foreground">
              <Trophy className="inline size-3 mr-1 text-amber-500" />
              Best:{" "}
              <span className="text-foreground font-medium">
                {subject.strongestTopic}
              </span>
            </p>
          ) : null}
          {subject.weakestTopic ? (
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline size-3 mr-1 text-red-500" />
              Needs work:{" "}
              <span className="text-foreground font-medium">
                {subject.weakestTopic}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function TopicAccordion({ data }: { data: TopicMasteryBySubject[] }) {
  return (
    <Accordion multiple className="grid gap-1">
      {data.map((sg) => (
        <AccordionItem
          key={sg.subjectId}
          value={sg.subjectId}
          className="rounded-xl border bg-card px-0 overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline min-h-[48px]">
            <span className="flex items-center gap-2">
              {sg.subjectName}
              <Badge variant="secondary" className="text-xs font-normal">
                {sg.topics.length} topic{sg.topics.length !== 1 ? "s" : ""}
              </Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0">
            <div className="divide-y border-t">
              {sg.topics.map((t) => (
                <div
                  key={t.topicId}
                  className="flex items-center gap-3 px-4 py-3 min-h-[44px]"
                >
                  {/* Mastery dot */}
                  <div
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      t.accuracy == null
                        ? "bg-muted-foreground/40"
                        : t.accuracy >= 70
                          ? "bg-emerald-500"
                          : t.accuracy >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                    )}
                  />
                  <span className="flex-1 min-w-0 text-sm leading-snug truncate">
                    {t.topicName}
                  </span>
                  {/* On mobile: just accuracy badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {t.attempted} tried
                    </span>
                    {t.accuracy != null ? (
                      <Badge
                        variant="outline"
                        className={cn("text-xs", accuracyBg(t.accuracy))}
                      >
                        {t.accuracy}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        —
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

function RecentSessionRow({ session }: { session: RecentSession }) {
  const ago = formatDistanceToNowStrict(new Date(session.startedAt), {
    addSuffix: true,
  })
  const href = `/practice/session/${session.id}/summary`

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 min-h-[56px] transition-colors hover:border-primary/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{session.scope}</span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {session.correctCount}/{session.totalQuestions} correct ·{" "}
          {fmtTime(session.totalTimeSeconds)} · {ago}
        </div>
      </div>
      {session.accuracy != null ? (
        <Badge
          variant="outline"
          className={cn("shrink-0 text-xs", accuracyBg(session.accuracy))}
        >
          {session.accuracy}%
        </Badge>
      ) : null}
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function WeakAreasSection({ weakTopics }: { weakTopics: WeakTopic[] }) {
  if (weakTopics.length === 0) {
    return (
      <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
        <TrendingUp className="size-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          Keep practising to see detailed insights
        </p>
        <p className="text-xs text-muted-foreground">
          Topics with ≥5 attempts and accuracy below 50% will appear here.
        </p>
        <Link
          href="/practice"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline min-h-[44px]"
        >
          <BookOpen className="size-3.5" />
          Start practising
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-3 grid gap-3">
      {weakTopics.map((t) => (
        <div
          key={t.topicId}
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 min-h-[56px]"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{t.topicName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t.subjectName} · {t.attempted} attempts · {t.accuracy}% accuracy
            </p>
          </div>
          <form action={startSession}>
            <input type="hidden" name="scope" value="topic" />
            <input type="hidden" name="scopeId" value={t.topicId} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 min-h-[36px] shrink-0"
            >
              <Zap className="size-3.5" />
              Practice this
            </button>
          </form>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
      <TrendingUp className="size-10 text-muted-foreground/30" />
      <div>
        <p className="font-semibold">No practice data yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your first session and come back here to track your progress.
        </p>
      </div>
      <Link
        href="/practice"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
      >
        <BookOpen className="size-4" />
        Start practising
      </Link>
    </div>
  )
}
