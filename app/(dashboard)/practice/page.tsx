import Link from "next/link"
import {
  Atom,
  FlaskConical,
  History,
  Shuffle,
  Sigma,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getSubjectsWithCounts } from "@/lib/queries/practice"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { StartSessionForm } from "@/components/practice/start-session-form"
import { PracticeToast } from "@/components/practice/practice-toast"

export const dynamic = "force-dynamic"

type SubjectTheme = { icon: LucideIcon; iconBg: string; border: string; label: string }

const SUBJECT_THEME: Record<string, SubjectTheme> = {
  physics: {
    icon: Atom,
    iconBg: "bg-sky-500/15 text-sky-600",
    border: "border-l-sky-500",
    label: "Physics",
  },
  chemistry: {
    icon: FlaskConical,
    iconBg: "bg-emerald-500/15 text-emerald-600",
    border: "border-l-emerald-500",
    label: "Chemistry",
  },
  mathematics: {
    icon: Sigma,
    iconBg: "bg-violet-500/15 text-violet-600",
    border: "border-l-violet-500",
    label: "Mathematics",
  },
}

export default async function PracticeLandingPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ""

  const [subjects, activeSessionRes] = await Promise.all([
    getSubjectsWithCounts(userId),
    supabase
      .from("practice_sessions")
      .select("id, started_at, topic_id, chapter_id, subject_id, topics(name), chapters(name), subjects(name)")
      .eq("user_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const active = activeSessionRes.data as unknown as {
    id: string
    started_at: string
    topics?: { name?: string } | null
    chapters?: { name?: string } | null
    subjects?: { name?: string } | null
  } | null | undefined

  const activeScope =
    active?.topics?.name || active?.chapters?.name || active?.subjects?.name || "Mixed practice"

  return (
    <div className="grid gap-6">
      <PracticeToast error={searchParams.error} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Practice</h1>
        <p className="text-sm text-muted-foreground">Choose a subject to begin.</p>
      </div>

      {/* ── Subject cards: stacked on mobile, 3-col on desktop ── */}
      <section className="grid gap-3 md:grid-cols-3">
        {subjects.map((s) => {
          const theme = SUBJECT_THEME[s.slug] ?? SUBJECT_THEME.physics
          const Icon = theme.icon
          return (
            <Link
              key={s.id}
              href={`/practice/${s.slug}`}
              className={cn(
                "group flex min-h-[80px] items-center gap-4 rounded-xl border-l-4 border border-l-4 bg-card px-4 py-4",
                "transition-all duration-150 hover:shadow-md hover:border-opacity-80",
                theme.border
              )}
            >
              <div className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-xl", theme.iconBg)}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {s.questionCount} question{s.questionCount !== 1 ? "s" : ""}
                </p>
              </div>
              {/* Accuracy pill */}
              {s.userAccuracy != null ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    s.userAccuracy >= 70
                      ? "bg-emerald-500/15 text-emerald-700"
                      : s.userAccuracy >= 40
                        ? "bg-amber-500/15 text-amber-700"
                        : "bg-red-500/15 text-red-700"
                  )}
                >
                  {s.userAccuracy}%
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">New</Badge>
              )}
            </Link>
          )
        })}
      </section>

      {/* ── Quick actions ── */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick practice
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {active ? (
            <Link
              href={`/practice/session/${active.id}`}
              className="group flex min-h-[72px] items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <History className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Resume session</span>
                  <Badge variant="outline" className="text-xs">In progress</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{activeScope}</p>
              </div>
            </Link>
          ) : (
            <Card className="opacity-60">
              <CardContent className="flex min-h-[72px] items-center gap-3 px-4 py-3">
                <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <History className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No active session</p>
                  <p className="text-xs text-muted-foreground">Start one above</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex min-h-[72px] items-center gap-3 rounded-xl border bg-card px-4 py-3">
            <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-warm/15 text-amber-600">
              <Shuffle className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Surprise me</span>
                <Badge variant="outline" className="gap-1 text-xs">
                  <Sparkles className="size-3" /> mixed
                </Badge>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">Random questions, all subjects</p>
              <StartSessionForm scope="mixed" size="sm">
                Start mixed session
              </StartSessionForm>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
