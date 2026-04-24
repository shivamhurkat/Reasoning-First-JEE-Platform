import Link from "next/link"
import {
  ArrowRight,
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

const SUBJECT_THEME: Record<
  string,
  { icon: LucideIcon; gradient: string; iconBg: string; accent: string }
> = {
  physics: {
    icon: Atom,
    gradient:
      "from-sky-500/15 via-blue-500/10 to-transparent dark:from-sky-500/10 dark:via-blue-500/5",
    iconBg: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    accent: "hover:border-sky-500/50",
  },
  chemistry: {
    icon: FlaskConical,
    gradient:
      "from-emerald-500/15 via-teal-500/10 to-transparent dark:from-emerald-500/10 dark:via-teal-500/5",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    accent: "hover:border-emerald-500/50",
  },
  mathematics: {
    icon: Sigma,
    gradient:
      "from-violet-500/15 via-fuchsia-500/10 to-transparent dark:from-violet-500/10 dark:via-fuchsia-500/5",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    accent: "hover:border-violet-500/50",
  },
}

export default async function PracticeLandingPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id ?? ""

  const [subjects, activeSessionRes] = await Promise.all([
    getSubjectsWithCounts(userId),
    supabase
      .from("practice_sessions")
      .select(
        "id, started_at, topic_id, chapter_id, subject_id, topics(name), chapters(name), subjects(name)"
      )
      .eq("user_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const active = activeSessionRes.data as unknown as
    | {
        id: string
        started_at: string
        topics?: { name?: string } | null
        chapters?: { name?: string } | null
        subjects?: { name?: string } | null
      }
    | null
    | undefined

  const activeScope =
    active?.topics?.name ||
    active?.chapters?.name ||
    active?.subjects?.name ||
    "Mixed practice"

  return (
    <div className="grid gap-8">
      <PracticeToast error={searchParams.error} />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-sm text-muted-foreground">
          Choose a subject to begin.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {subjects.map((s) => {
          const theme = SUBJECT_THEME[s.slug] ?? SUBJECT_THEME.physics
          const Icon = theme.icon
          return (
            <Link
              key={s.id}
              href={`/practice/${s.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all",
                theme.accent,
                "hover:shadow-md"
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br",
                  theme.gradient
                )}
              />
              <div className="relative flex items-start justify-between">
                <div
                  className={cn(
                    "inline-flex size-10 items-center justify-center rounded-lg",
                    theme.iconBg
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="relative mt-4">
                <h3 className="text-lg font-semibold">{s.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.questionCount} question
                  {s.questionCount === 1 ? "" : "s"} available
                </p>
              </div>
              <div className="relative mt-4 flex items-center gap-4 text-xs">
                <div>
                  <div className="font-medium text-foreground">
                    {s.userAccuracy != null ? `${s.userAccuracy}%` : "—"}
                  </div>
                  <div className="text-muted-foreground">
                    {s.userAccuracy != null ? "accuracy" : "not started"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {s.userAttempted}
                  </div>
                  <div className="text-muted-foreground">attempted</div>
                </div>
              </div>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Quick practice
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {active ? (
            <Link
              href={`/practice/session/${active.id}`}
              className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <History className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      Continue where you left off
                    </h3>
                    <Badge variant="outline">In progress</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeScope}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ) : (
            <Card className="opacity-60">
              <CardContent className="flex items-start gap-3 p-5">
                <div className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <History className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-muted-foreground">
                    No active session
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start one to see resume here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
            <div className="flex items-start gap-3">
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300">
                <Shuffle className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Surprise me</h3>
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="size-3" /> mixed
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Random questions across every subject.
                </p>
                <div className="mt-3">
                  <StartSessionForm scope="mixed">
                    Start mixed session
                  </StartSessionForm>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
