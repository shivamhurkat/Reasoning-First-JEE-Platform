"use client"

import { Clock, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { MathPreview } from "@/components/math-preview"
import {
  APPROACH_TO_SOLUTION,
  SOLUTION_TYPE_LABELS,
  SOLUTION_TYPE_ORDER,
  type ApproachId,
  type SolutionType,
} from "@/lib/constants/practice"
import type { SolutionData } from "@/lib/queries/practice"

export function SolutionTabs({
  solutions,
  chosenApproach,
}: {
  solutions: SolutionData[]
  chosenApproach: ApproachId | null
}) {
  const byType = new Map<SolutionType, SolutionData>()
  for (const s of solutions) byType.set(s.solution_type, s)

  const yourTabType = chosenApproach
    ? APPROACH_TO_SOLUTION[chosenApproach]
    : null

  // Default tab: prefer the user's approach if available, else standard, else
  // the first available in canonical order.
  const defaultTab =
    (yourTabType && byType.has(yourTabType) && yourTabType) ||
    (byType.has("standard") ? "standard" : SOLUTION_TYPE_ORDER.find((t) => byType.has(t))) ||
    SOLUTION_TYPE_ORDER[0]

  return (
    <Tabs defaultValue={defaultTab} className="grid gap-4">
      <TabsList className="flex flex-wrap">
        {SOLUTION_TYPE_ORDER.map((t) => {
          const has = byType.has(t)
          const isYours = yourTabType === t
          return (
            <TabsTrigger
              key={t}
              value={t}
              disabled={!has}
              className={cn(
                "gap-1.5",
                isYours && "data-[selected]:bg-primary/10"
              )}
            >
              {SOLUTION_TYPE_LABELS[t]}
              {isYours ? (
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-[10px] leading-none"
                >
                  Your approach
                </Badge>
              ) : null}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {SOLUTION_TYPE_ORDER.map((t) => {
        const s = byType.get(t)
        return (
          <TabsContent key={t} value={t} className="m-0">
            {s ? <SolutionBody solution={s} /> : <EmptySolution type={t} />}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

function SolutionBody({ solution }: { solution: SolutionData }) {
  const showCallouts =
    solution.solution_type === "shortcut" ||
    solution.solution_type === "elimination" ||
    solution.solution_type === "pattern"

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-5">
      {solution.title ? (
        <h3 className="text-base font-medium">{solution.title}</h3>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {solution.time_estimate_seconds != null ? (
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            ~{Math.round(solution.time_estimate_seconds)}s
          </Badge>
        ) : null}
        {solution.difficulty_to_execute != null ? (
          <Badge variant="outline">
            Execution difficulty {solution.difficulty_to_execute}/5
          </Badge>
        ) : null}
      </div>

      <MathPreview value={solution.content} />

      {solution.steps && solution.steps.length > 0 ? (
        <ol className="grid gap-2">
          {solution.steps.map((st, i) => (
            <li
              key={i}
              className="rounded-md border bg-muted/30 p-3 text-sm"
            >
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Step {st.step_number}
              </div>
              <MathPreview value={st.text} />
              {st.explanation ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {st.explanation}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {showCallouts &&
      (solution.when_to_use || solution.when_not_to_use) ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {solution.when_to_use ? (
            <Callout title="When to use">{solution.when_to_use}</Callout>
          ) : null}
          {solution.when_not_to_use ? (
            <Callout title="When not to use" tone="warning">
              {solution.when_not_to_use}
            </Callout>
          ) : null}
        </div>
      ) : null}

      {solution.prerequisites ? (
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Prerequisites:</strong>{" "}
          {solution.prerequisites}
        </p>
      ) : null}
    </div>
  )
}

function Callout({
  title,
  children,
  tone = "info",
}: {
  title: string
  children: React.ReactNode
  tone?: "info" | "warning"
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-sm",
        tone === "info"
          ? "border-primary/20 bg-primary/5"
          : "border-amber-500/30 bg-amber-500/10"
      )}
    >
      <div className="mb-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <p>{children}</p>
    </div>
  )
}

function EmptySolution({ type }: { type: SolutionType }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
      <Info className="size-4" />
      No {SOLUTION_TYPE_LABELS[type].toLowerCase()} solution for this question.
    </div>
  )
}
