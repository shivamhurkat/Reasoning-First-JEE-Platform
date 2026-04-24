"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MathPreview } from "@/components/math-preview"
import type { QuestionData } from "@/lib/queries/practice"

export type AnswerInput =
  | { type: "single"; value: string }
  | { type: "multi"; values: string[] }
  | { type: "numerical"; value: number | null }
  | { type: "subjective"; value: string }
  | null

export function emptyAnswerFor(question: QuestionData): AnswerInput {
  switch (question.question_type) {
    case "single_correct":
      return { type: "single", value: "" }
    case "multi_correct":
      return { type: "multi", values: [] }
    case "numerical":
      return { type: "numerical", value: null }
    case "subjective":
      return { type: "subjective", value: "" }
  }
}

export function hasAnswer(answer: AnswerInput): boolean {
  if (!answer) return false
  if (answer.type === "single") return answer.value !== ""
  if (answer.type === "multi") return answer.values.length > 0
  if (answer.type === "numerical")
    return answer.value !== null && Number.isFinite(answer.value)
  if (answer.type === "subjective") return answer.value.trim().length > 0
  return false
}

export function AnswerArea({
  question,
  answer,
  onChange,
  locked,
  disabled,
}: {
  question: QuestionData
  answer: AnswerInput
  onChange: (next: AnswerInput) => void
  locked?: boolean
  disabled?: boolean
}) {
  if (question.question_type === "single_correct") {
    const current = answer && answer.type === "single" ? answer.value : ""
    return (
      <div className="grid gap-2" aria-disabled={disabled}>
        {(question.options ?? []).map((opt, idx) => {
          const letterKey = String.fromCharCode(65 + idx)
          const active = current === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled || locked}
              onClick={() => onChange({ type: "single", value: opt.id })}
              className={cn(
                "flex w-full min-h-[52px] items-center gap-3 rounded-xl border bg-card px-3 py-3 text-left",
                "transition-all duration-150 outline-none",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "hover:border-primary/40",
                "focus-visible:ring-2 focus-visible:ring-ring/40",
                (disabled || locked) && "pointer-events-none opacity-70"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {letterKey}
              </span>
              <div className="min-w-0 flex-1">
                <MathPreview value={opt.text} block={false} />
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  if (question.question_type === "multi_correct") {
    const values = answer && answer.type === "multi" ? new Set(answer.values) : new Set()
    return (
      <div className="grid gap-2">
        {(question.options ?? []).map((opt, idx) => {
          const letterKey = String.fromCharCode(65 + idx)
          const active = values.has(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled || locked}
              onClick={() => {
                const next = new Set(values)
                if (next.has(opt.id)) next.delete(opt.id)
                else next.add(opt.id)
                onChange({
                  type: "multi",
                  values: Array.from(next).filter((v): v is string => typeof v === "string"),
                })
              }}
              className={cn(
                "flex w-full min-h-[52px] items-center gap-3 rounded-xl border bg-card px-3 py-3 text-left",
                "transition-all duration-150",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "hover:border-primary/40",
                (disabled || locked) && "pointer-events-none opacity-70"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {letterKey}
              </span>
              <div className="min-w-0 flex-1">
                <MathPreview value={opt.text} block={false} />
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  if (question.question_type === "numerical") {
    const ca = question.correct_answer as { tolerance?: number }
    const tolerance = ca?.tolerance ?? 0.01
    const current =
      answer && answer.type === "numerical" && answer.value !== null
        ? String(answer.value)
        : ""
    return (
      <div className="grid gap-2">
        <Label htmlFor="num-answer" className="text-sm text-muted-foreground">
          Your answer — tolerance ± {tolerance}
        </Label>
        {/* font-size 16px enforced by globals.css; height 48px for thumb target */}
        <Input
          id="num-answer"
          type="number"
          step="any"
          placeholder="Enter a number"
          value={current}
          disabled={disabled || locked}
          className="h-12 text-center text-lg tabular-nums"
          style={{ fontSize: "16px" }}
          onChange={(e) => {
            const raw = e.target.value
            onChange({ type: "numerical", value: raw === "" ? null : Number(raw) })
          }}
        />
      </div>
    )
  }

  // subjective
  const current = answer && answer.type === "subjective" ? answer.value : ""
  return (
    <div className="grid gap-2">
      <Label htmlFor="subj-answer" className="text-sm text-muted-foreground">
        Your answer (not auto-graded — reference shown after submit)
      </Label>
      <Textarea
        id="subj-answer"
        rows={4}
        value={current}
        disabled={disabled || locked}
        className="text-base"
        style={{ fontSize: "16px" }}
        onChange={(e) => onChange({ type: "subjective", value: e.target.value })}
      />
    </div>
  )
}
