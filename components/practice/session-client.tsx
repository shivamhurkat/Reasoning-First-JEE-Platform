"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Check,
  CheckCircle2,
  Circle,
  Timer,
  X,
  XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MathPreview } from "@/components/math-preview"
import { ApproachButtons } from "@/components/practice/approach-buttons"
import {
  AnswerArea,
  emptyAnswerFor,
  hasAnswer,
  type AnswerInput,
} from "@/components/practice/answer-area"
import { SolutionTabs } from "@/components/practice/solution-tabs"
import {
  APPROACHES,
  type ApproachId,
} from "@/lib/constants/practice"
import type {
  CorrectAnswer,
  QuestionData,
  SolutionData,
} from "@/lib/queries/practice"
import {
  endSession,
  getNextQuestion,
  submitAttempt,
} from "@/app/(dashboard)/practice/actions"

// ---------- utilities ----------

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function checkCorrectness(
  answer: AnswerInput,
  correct: CorrectAnswer
): boolean | null {
  if (!answer) return null
  if (correct.type === "single" && answer.type === "single") {
    return answer.value === correct.value
  }
  if (correct.type === "multi" && answer.type === "multi") {
    const a = [...answer.values].sort()
    const b = [...correct.values].sort()
    return a.length === b.length && a.every((v, i) => v === b[i])
  }
  if (correct.type === "numerical" && answer.type === "numerical") {
    if (answer.value === null || !Number.isFinite(answer.value)) return false
    const tol = correct.tolerance ?? 0.01
    return Math.abs(answer.value - correct.value) <= tol
  }
  if (correct.type === "subjective") return null
  return null
}

function approachLabel(id: ApproachId | null): string {
  if (!id) return ""
  return APPROACHES.find((a) => a.id === id)?.label ?? id
}

// ---------- types ----------

type Phase =
  | "approach_selection"
  | "solving"
  | "submitted"
  | "exhausted"

type SessionStats = {
  attempted: number
  correct: number
}

// ---------- component ----------

export function SessionClient({
  sessionId,
  scopeLabel,
  initialQuestionNumber,
  initialCorrectCount,
  initialAttempted,
  question: initialQuestion,
  solutions: initialSolutions,
}: {
  sessionId: string
  scopeLabel: string
  initialQuestionNumber: number
  initialCorrectCount: number
  initialAttempted: number
  question: QuestionData
  solutions: SolutionData[]
}) {
  const router = useRouter()

  const [question, setQuestion] = useState<QuestionData>(initialQuestion)
  const [solutions, setSolutions] = useState<SolutionData[]>(initialSolutions)
  const [questionNumber, setQuestionNumber] = useState<number>(
    initialQuestionNumber
  )
  const [stats, setStats] = useState<SessionStats>({
    attempted: initialAttempted,
    correct: initialCorrectCount,
  })

  const [phase, setPhase] = useState<Phase>("approach_selection")
  const [approach, setApproach] = useState<ApproachId | null>(null)
  const [approachChosenAt, setApproachChosenAt] = useState<string | null>(null)
  const [answer, setAnswer] = useState<AnswerInput>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [submittedTimeSec, setSubmittedTimeSec] = useState<number>(0)

  const [exitOpen, setExitOpen] = useState(false)
  const [pendingNext, startNext] = useTransition()
  const [pendingEnd, startEnd] = useTransition()
  const [pendingSubmit, startSubmit] = useTransition()

  // Timer: counts up from questionStartedAt until phase === "submitted".
  const questionStartedAtRef = useRef<number>(Date.now())
  const [nowMs, setNowMs] = useState<number>(Date.now())

  useEffect(() => {
    if (phase === "submitted" || phase === "exhausted") return
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [phase])

  const elapsedSec =
    phase === "submitted"
      ? submittedTimeSec
      : Math.max(0, Math.floor((nowMs - questionStartedAtRef.current) / 1000))

  // ---------- handlers ----------

  const handleSelectApproach = useCallback(
    (id: ApproachId) => {
      if (phase !== "approach_selection") return
      setApproach(id)
      setApproachChosenAt(new Date().toISOString())

      if (id === "skip") {
        // Skip → record immediately and jump to submitted.
        const timeTaken = Math.max(
          0,
          Math.floor((Date.now() - questionStartedAtRef.current) / 1000)
        )
        setSubmittedTimeSec(timeTaken)
        setIsCorrect(null) // treated as not-correct for stats, but no red X
        setStats((s) => ({ ...s, attempted: s.attempted + 1 }))
        setPhase("submitted")
        startSubmit(async () => {
          const res = await submitAttempt({
            sessionId,
            questionId: question.id,
            approach: "skip",
            answer: null,
            isCorrect: false, // a skip is recorded as not-correct
            timeTakenSeconds: timeTaken,
            approachChosenAt: new Date().toISOString(),
          })
          if (!res.ok) console.warn("submitAttempt failed:", res.error)
        })
        return
      }

      setAnswer(emptyAnswerFor(question))
      setPhase("solving")
    },
    [phase, question, sessionId]
  )

  const handleChangeApproach = useCallback(() => {
    // Allowed but recorded — we just let the user re-pick, and the most
    // recent approach is what the server sees on submit.
    setPhase("approach_selection")
    setAnswer(null)
  }, [])

  const handleSubmit = useCallback(() => {
    if (phase !== "solving") return
    if (!approach) return
    if (!hasAnswer(answer)) return

    const timeTaken = Math.max(
      0,
      Math.floor((Date.now() - questionStartedAtRef.current) / 1000)
    )
    const correctness = checkCorrectness(answer, question.correct_answer)

    setSubmittedTimeSec(timeTaken)
    setIsCorrect(correctness)
    setStats((s) => ({
      attempted: s.attempted + 1,
      correct: s.correct + (correctness === true ? 1 : 0),
    }))
    setPhase("submitted")

    startSubmit(async () => {
      const res = await submitAttempt({
        sessionId,
        questionId: question.id,
        approach,
        answer,
        isCorrect: correctness === null ? null : correctness,
        timeTakenSeconds: timeTaken,
        approachChosenAt: approachChosenAt,
      })
      if (!res.ok) console.warn("submitAttempt failed:", res.error)
    })
  }, [phase, approach, answer, question, sessionId, approachChosenAt])

  const handleNext = useCallback(() => {
    startNext(async () => {
      const res = await getNextQuestion(sessionId)
      if (!res.ok) {
        router.refresh()
        return
      }
      if (res.exhausted) {
        setPhase("exhausted")
        return
      }
      // Reset state for next question.
      setQuestion(res.question)
      setSolutions(res.solutions)
      setQuestionNumber((n) => n + 1)
      setApproach(null)
      setApproachChosenAt(null)
      setAnswer(null)
      setIsCorrect(null)
      setSubmittedTimeSec(0)
      questionStartedAtRef.current = Date.now()
      setNowMs(Date.now())
      setPhase("approach_selection")
    })
  }, [sessionId, router])

  const handleEnd = useCallback(
    (confirm = true) => {
      if (confirm && phase === "solving") {
        setExitOpen(true)
        return
      }
      startEnd(async () => {
        await endSession(sessionId)
        router.push(`/practice/session/${sessionId}/summary`)
      })
    },
    [phase, router, sessionId]
  )

  // ---------- keyboard shortcuts ----------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea.
      const target = e.target as HTMLElement
      const tag = target.tagName
      const isTyping =
        tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable
      if (isTyping) {
        // Still allow Enter-to-submit from a numerical input.
        if (
          e.key === "Enter" &&
          phase === "solving" &&
          hasAnswer(answer) &&
          !e.shiftKey
        ) {
          e.preventDefault()
          handleSubmit()
        }
        return
      }

      if (phase === "approach_selection") {
        const n = Number(e.key)
        if (n >= 1 && n <= 5) {
          e.preventDefault()
          handleSelectApproach(APPROACHES[n - 1].id)
        }
        return
      }

      if (phase === "solving") {
        // A/B/C/D option selection for single_correct MCQs.
        const key = e.key.toUpperCase()
        if (
          (question.question_type === "single_correct" ||
            question.question_type === "multi_correct") &&
          key.length === 1 &&
          key >= "A" &&
          key <= "Z"
        ) {
          const idx = key.charCodeAt(0) - 65
          const opt = question.options?.[idx]
          if (opt) {
            e.preventDefault()
            if (question.question_type === "single_correct") {
              setAnswer({ type: "single", value: opt.id })
            } else {
              setAnswer((prev) => {
                const current =
                  prev && prev.type === "multi" ? new Set(prev.values) : new Set<string>()
                if (current.has(opt.id)) current.delete(opt.id)
                else current.add(opt.id)
                return { type: "multi", values: Array.from(current) }
              })
            }
          }
          return
        }
        if (e.key === "Enter" && hasAnswer(answer)) {
          e.preventDefault()
          handleSubmit()
        }
        return
      }

      if (phase === "submitted") {
        if (e.key === "Enter" || e.key === "ArrowRight") {
          e.preventDefault()
          handleNext()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, answer, question, handleSelectApproach, handleSubmit, handleNext])

  // ---------- derived UI ----------

  const accuracyPct = useMemo(() => {
    if (stats.attempted === 0) return null
    return Math.round((stats.correct / stats.attempted) * 100)
  }, [stats])

  const optimalSec = question.estimated_time_seconds
  const timeDelta = submittedTimeSec - optimalSec

  return (
    <div className="flex min-h-screen flex-col">
      <SessionHeader
        scopeLabel={scopeLabel}
        questionNumber={questionNumber}
        stats={stats}
        accuracyPct={accuracyPct}
        elapsedSec={elapsedSec}
        running={phase !== "submitted" && phase !== "exhausted"}
        onExit={() => handleEnd(true)}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-6">
        {phase === "exhausted" ? (
          <ExhaustedPanel
            sessionId={sessionId}
            onEnd={() => handleEnd(false)}
            pendingEnd={pendingEnd}
          />
        ) : (
          <>
            <QuestionCard
              question={question}
              approach={approach}
              phase={phase}
              optimalSec={optimalSec}
            />

            {phase === "approach_selection" ? (
              <div className="mt-6 grid gap-3">
                <p className="text-sm font-medium">
                  Commit to an approach before you see the answer area.
                </p>
                <ApproachButtons onSelect={handleSelectApproach} />
              </div>
            ) : null}

            {phase === "solving" ? (
              <div className="mt-6 grid gap-4">
                <AnswerArea
                  question={question}
                  answer={answer}
                  onChange={setAnswer}
                />
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={!hasAnswer(answer) || pendingSubmit}
                  >
                    {pendingSubmit ? "Submitting..." : "Submit answer"}
                  </Button>
                  <button
                    type="button"
                    onClick={handleChangeApproach}
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Change approach
                  </button>
                  <span className="ml-auto text-xs text-muted-foreground">
                    Press Enter to submit
                  </span>
                </div>
              </div>
            ) : null}

            {phase === "submitted" ? (
              <ResultPanel
                question={question}
                solutions={solutions}
                answer={answer}
                approach={approach}
                isCorrect={isCorrect}
                takenSec={submittedTimeSec}
                optimalSec={optimalSec}
                timeDelta={timeDelta}
                onNext={handleNext}
                onEnd={() => handleEnd(false)}
                pendingNext={pendingNext}
                pendingEnd={pendingEnd}
              />
            ) : null}
          </>
        )}
      </main>

      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End session?</DialogTitle>
            <DialogDescription>
              You haven&apos;t submitted this question. We&apos;ll end the
              session and take you to the summary — no penalty.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setExitOpen(false)}
              disabled={pendingEnd}
            >
              Keep practising
            </Button>
            <Button
              onClick={() => {
                setExitOpen(false)
                handleEnd(false)
              }}
              disabled={pendingEnd}
            >
              {pendingEnd ? "Ending..." : "End session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- sub-views ----------

function SessionHeader({
  scopeLabel,
  questionNumber,
  stats,
  accuracyPct,
  elapsedSec,
  running,
  onExit,
}: {
  scopeLabel: string
  questionNumber: number
  stats: SessionStats
  accuracyPct: number | null
  elapsedSec: number
  running: boolean
  onExit: () => void
}) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{scopeLabel}</span>
            <Badge variant="outline">Question {questionNumber}</Badge>
            <Badge variant="secondary">
              {accuracyPct != null ? `${accuracyPct}% · ` : ""}
              {stats.correct}/{stats.attempted}
            </Badge>
          </div>
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-mono tabular-nums",
            running
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border bg-muted text-muted-foreground"
          )}
          aria-label="Elapsed time"
        >
          <Timer className="size-3.5" />
          {fmt(elapsedSec)}
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onExit}
          aria-label="Exit session"
        >
          <X />
        </Button>
      </div>
    </header>
  )
}

function QuestionCard({
  question,
  approach,
  phase,
  optimalSec,
}: {
  question: QuestionData
  approach: ApproachId | null
  phase: Phase
  optimalSec: number
}) {
  const tag = [question.subject_name, question.chapter_name, question.topic_name]
    .filter(Boolean)
    .join(" › ")
  return (
    <div className="grid gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {tag ? <span>{tag}</span> : null}
        {tag ? <span>·</span> : null}
        <span>Difficulty {question.difficulty}/5</span>
        <span>·</span>
        <span>~{optimalSec}s</span>
        {question.source ? (
          <>
            <span>·</span>
            <span>{question.source}</span>
          </>
        ) : null}
        {approach && phase !== "approach_selection" ? (
          <Badge variant="secondary" className="ml-auto">
            Approach · {approachLabel(approach)}
          </Badge>
        ) : null}
      </div>

      {question.question_image_url ? (
        <div className="overflow-hidden rounded-md border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.question_image_url}
            alt="Question"
            className="w-full object-contain max-h-[400px]"
          />
        </div>
      ) : null}
      {question.question_text ? (
        <MathPreview value={question.question_text} />
      ) : null}
    </div>
  )
}

function ResultPanel({
  question,
  solutions,
  answer,
  approach,
  isCorrect,
  takenSec,
  optimalSec,
  timeDelta,
  onNext,
  onEnd,
  pendingNext,
  pendingEnd,
}: {
  question: QuestionData
  solutions: SolutionData[]
  answer: AnswerInput
  approach: ApproachId | null
  isCorrect: boolean | null
  takenSec: number
  optimalSec: number
  timeDelta: number
  onNext: () => void
  onEnd: () => void
  pendingNext: boolean
  pendingEnd: boolean
}) {
  const skipped = approach === "skip"

  const headline = skipped
    ? {
        icon: (
          <Circle className="size-8 text-sky-500" />
        ),
        text: "No problem — here's how to approach this",
        tone: "text-sky-600 dark:text-sky-300",
        bg: "bg-sky-500/5 border-sky-500/20",
      }
    : isCorrect === true
      ? {
          icon: <CheckCircle2 className="size-8 text-emerald-600" />,
          text: "Correct!",
          tone: "text-emerald-700 dark:text-emerald-400",
          bg: "bg-emerald-500/5 border-emerald-500/20",
        }
      : isCorrect === false
        ? {
            icon: <XCircle className="size-8 text-red-600" />,
            text: "Not quite",
            tone: "text-red-700 dark:text-red-400",
            bg: "bg-red-500/5 border-red-500/20",
          }
        : {
            icon: <Check className="size-8 text-primary" />,
            text: "Answer submitted",
            tone: "text-primary",
            bg: "bg-primary/5 border-primary/20",
          }

  const timeCopy = skipped
    ? null
    : timeDelta <= -5
      ? `Well under par (optimal ~${fmt(optimalSec)})`
      : timeDelta <= 5
        ? `Right on pace (optimal ~${fmt(optimalSec)})`
        : `Over par by ${fmt(Math.abs(timeDelta))} (optimal ~${fmt(optimalSec)})`

  return (
    <div className="mt-6 grid gap-6">
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-xl border p-5",
          headline.bg
        )}
      >
        {headline.icon}
        <div className="min-w-0 flex-1">
          <h2 className={cn("text-xl font-semibold", headline.tone)}>
            {headline.text}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            You took {fmt(takenSec)}
            {timeCopy ? ` · ${timeCopy}` : ""}
          </p>
        </div>
      </div>

      <CorrectAnswerReveal
        question={question}
        answer={answer}
        isCorrect={isCorrect}
        skipped={skipped}
      />

      <section className="grid gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Reasoning-first solutions
        </h3>
        <SolutionTabs solutions={solutions} chosenApproach={approach} />
      </section>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:-mx-6 md:px-6">
        <Button onClick={onNext} disabled={pendingNext}>
          {pendingNext ? "Loading..." : "Next question"}
        </Button>
        <Button
          variant="outline"
          onClick={onEnd}
          disabled={pendingEnd}
        >
          {pendingEnd ? "Ending..." : "End session"}
        </Button>
        <span className="ml-auto hidden text-xs text-muted-foreground md:inline">
          Press Enter for the next question
        </span>
      </div>
    </div>
  )
}

function CorrectAnswerReveal({
  question,
  answer,
  isCorrect,
  skipped,
}: {
  question: QuestionData
  answer: AnswerInput
  isCorrect: boolean | null
  skipped: boolean
}) {
  const correct = question.correct_answer

  // Options highlight: show correct tick and user's mark.
  if (
    (question.question_type === "single_correct" ||
      question.question_type === "multi_correct") &&
    question.options
  ) {
    const correctSet =
      correct.type === "single"
        ? new Set([correct.value])
        : correct.type === "multi"
          ? new Set(correct.values)
          : new Set<string>()

    const userSet =
      answer && answer.type === "single"
        ? new Set([answer.value])
        : answer && answer.type === "multi"
          ? new Set(answer.values)
          : new Set<string>()

    return (
      <div className="grid gap-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Correct answer
        </div>
        {question.options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx)
          const isCorrectOpt = correctSet.has(opt.id)
          const isUserPick = userSet.has(opt.id)
          return (
            <div
              key={opt.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-2.5",
                isCorrectOpt
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : isUserPick
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border bg-card"
              )}
            >
              <span className="mt-0.5 inline-flex size-6 items-center justify-center rounded-md border text-xs font-semibold">
                {letter}
              </span>
              <div className="min-w-0 flex-1">
                <MathPreview value={opt.text} block={false} />
              </div>
              {isCorrectOpt ? (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                  Correct
                </Badge>
              ) : isUserPick && !skipped && isCorrect === false ? (
                <Badge variant="destructive">Your pick</Badge>
              ) : null}
            </div>
          )
        })}
      </div>
    )
  }

  if (correct.type === "numerical") {
    const userVal =
      answer && answer.type === "numerical" ? answer.value : null
    return (
      <div className="rounded-lg border bg-card px-4 py-3 text-sm">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Correct answer
        </div>
        <div className="mt-1 font-semibold">
          {correct.value}
          {correct.tolerance != null ? (
            <span className="text-muted-foreground"> (± {correct.tolerance})</span>
          ) : null}
        </div>
        {userVal != null && !skipped ? (
          <div className="mt-1 text-xs text-muted-foreground">
            You entered:{" "}
            <span
              className={cn(
                "font-mono",
                isCorrect
                  ? "text-emerald-600"
                  : "text-red-600"
              )}
            >
              {userVal}
            </span>
          </div>
        ) : null}
      </div>
    )
  }

  if (correct.type === "subjective") {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Reference answer
        </div>
        <div className="mt-2">
          <MathPreview value={correct.value} />
        </div>
      </div>
    )
  }

  return null
}

function ExhaustedPanel({
  sessionId,
  onEnd,
  pendingEnd,
}: {
  sessionId: string
  onEnd: () => void
  pendingEnd: boolean
}) {
  return (
    <div className="mx-auto mt-20 max-w-xl text-center">
      <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">
        You&apos;ve worked through every question in scope.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        End this session to see your summary — or jump back to the practice
        home to pick another topic.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onEnd} disabled={pendingEnd}>
          {pendingEnd ? "Ending..." : "End session"}
        </Button>
        <Button render={<Link href="/practice" />} variant="outline">
          Switch topic
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Session ID: {sessionId.slice(0, 8)}
      </p>
    </div>
  )
}
