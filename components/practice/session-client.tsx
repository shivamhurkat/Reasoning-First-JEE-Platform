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
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MathPreview } from "@/components/math-preview"
import {
  AnswerArea,
  emptyAnswerFor,
  hasAnswer,
  type AnswerInput,
} from "@/components/practice/answer-area"
import { SolutionTabs } from "@/components/practice/solution-tabs"
import type { ApproachId } from "@/lib/constants/practice"
import type { CorrectAnswer, QuestionData, SolutionData } from "@/lib/queries/practice"
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

function checkCorrectness(answer: AnswerInput, correct: CorrectAnswer): boolean | null {
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

type Phase = "solving" | "submitted" | "exhausted"
type SessionStats = { attempted: number; correct: number }

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
  const [questionNumber, setQuestionNumber] = useState<number>(initialQuestionNumber)
  const [stats, setStats] = useState<SessionStats>({ attempted: initialAttempted, correct: initialCorrectCount })

  const [phase, setPhase] = useState<Phase>("solving")
  const [approach, setApproach] = useState<ApproachId>("full_solve")
  const [answer, setAnswer] = useState<AnswerInput>(emptyAnswerFor(initialQuestion))
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [submittedTimeSec, setSubmittedTimeSec] = useState<number>(0)

  const [exitOpen, setExitOpen] = useState(false)
  const [pendingNext, startNext] = useTransition()
  const [pendingEnd, startEnd] = useTransition()
  const [pendingSubmit, startSubmit] = useTransition()

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

  const handleSkip = useCallback(() => {
    const timeTaken = Math.max(0, Math.floor((Date.now() - questionStartedAtRef.current) / 1000))
    setSubmittedTimeSec(timeTaken)
    setIsCorrect(null)
    setApproach("skip")
    setStats((s) => ({ ...s, attempted: s.attempted + 1 }))
    setPhase("submitted")
    startSubmit(async () => {
      const res = await submitAttempt({
        sessionId, questionId: question.id, approach: "skip", answer: null,
        isCorrect: false, timeTakenSeconds: timeTaken, approachChosenAt: null,
      })
      if (!res.ok) console.warn("submitAttempt failed:", res.error)
    })
  }, [question, sessionId])

  const handleSubmit = useCallback(() => {
    if (phase !== "solving" || !hasAnswer(answer)) return
    const timeTaken = Math.max(0, Math.floor((Date.now() - questionStartedAtRef.current) / 1000))
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
        sessionId, questionId: question.id, approach: "full_solve", answer,
        isCorrect: correctness === null ? null : correctness,
        timeTakenSeconds: timeTaken, approachChosenAt: null,
      })
      if (!res.ok) console.warn("submitAttempt failed:", res.error)
    })
  }, [phase, answer, question, sessionId])

  const handleNext = useCallback(() => {
    startNext(async () => {
      const res = await getNextQuestion(sessionId)
      if (!res.ok) { router.refresh(); return }
      if (res.exhausted) { setPhase("exhausted"); return }
      setQuestion(res.question)
      setSolutions(res.solutions)
      setQuestionNumber((n) => n + 1)
      setApproach("full_solve")
      setAnswer(emptyAnswerFor(res.question))
      setIsCorrect(null)
      setSubmittedTimeSec(0)
      questionStartedAtRef.current = Date.now()
      setNowMs(Date.now())
      setPhase("solving")
    })
  }, [sessionId, router])

  const handleEnd = useCallback(
    (confirm = true) => {
      if (confirm && phase === "solving") { setExitOpen(true); return }
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
      const target = e.target as HTMLElement
      const tag = target.tagName
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable
      if (isTyping) {
        if (e.key === "Enter" && phase === "solving" && hasAnswer(answer) && !e.shiftKey) {
          e.preventDefault()
          handleSubmit()
        }
        return
      }
      if (phase === "solving") {
        const key = e.key.toUpperCase()
        if (
          (question.question_type === "single_correct" || question.question_type === "multi_correct") &&
          key.length === 1 && key >= "A" && key <= "Z"
        ) {
          const idx = key.charCodeAt(0) - 65
          const opt = question.options?.[idx]
          if (opt) {
            e.preventDefault()
            if (question.question_type === "single_correct") {
              setAnswer({ type: "single", value: opt.id })
            } else {
              setAnswer((prev) => {
                const current = prev && prev.type === "multi" ? new Set(prev.values) : new Set<string>()
                if (current.has(opt.id)) current.delete(opt.id)
                else current.add(opt.id)
                return { type: "multi", values: Array.from(current) }
              })
            }
          }
          return
        }
        if (e.key === "Enter" && hasAnswer(answer)) { e.preventDefault(); handleSubmit() }
        return
      }
      if (phase === "submitted") {
        if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); handleNext() }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, answer, question, handleSubmit, handleNext])

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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 md:px-6 md:py-6">
        {phase === "exhausted" ? (
          <ExhaustedPanel sessionId={sessionId} onEnd={() => handleEnd(false)} pendingEnd={pendingEnd} />
        ) : (
          <>
            <QuestionCard question={question} optimalSec={optimalSec} />

            {phase === "solving" ? (
              <div className="mt-4 grid gap-3">
                <AnswerArea question={question} answer={answer} onChange={setAnswer} />
                <LoadingButton
                  onClick={handleSubmit}
                  disabled={!hasAnswer(answer)}
                  loading={pendingSubmit}
                  loadingText="Checking…"
                  className="w-full min-h-[48px] md:w-auto"
                >
                  Submit answer
                </LoadingButton>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Skip this question
                  </button>
                  <span className="hidden text-xs text-muted-foreground md:inline">
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
              You haven&apos;t submitted this question. We&apos;ll end the session — no penalty.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExitOpen(false)} disabled={pendingEnd}>
              Keep practising
            </Button>
            <LoadingButton
              onClick={() => { setExitOpen(false); handleEnd(false) }}
              loading={pendingEnd}
              loadingText="Ending…"
            >
              End session
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- SessionHeader ----------

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
    /* glass-card is safe here — this is a FIXED/STICKY element */
    <header className="sticky top-0 z-10 border-b glass-card">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-2.5 md:px-6 md:py-3">
        {/* Q counter — compact on mobile */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold tabular-nums">Q{questionNumber}</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            · {stats.correct}/{stats.attempted}
            {accuracyPct != null ? ` · ${accuracyPct}%` : ""}
          </span>
        </div>

        {/* Scope label — truncates on mobile */}
        <span className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:inline">
          {scopeLabel}
        </span>
        <span className="flex-1 sm:hidden" aria-hidden />

        {/* Timer */}
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-mono tabular-nums",
            running
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border bg-muted text-muted-foreground"
          )}
          aria-label="Elapsed time"
        >
          <Timer className="size-3" />
          {fmt(elapsedSec)}
        </div>

        {/* Exit */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onExit}
          aria-label="Exit session"
          className="shrink-0"
        >
          <X />
        </Button>
      </div>
    </header>
  )
}

// ---------- QuestionCard ----------

function QuestionCard({
  question,
  optimalSec,
}: {
  question: QuestionData
  optimalSec: number
}) {
  const tag = [question.subject_name, question.chapter_name, question.topic_name]
    .filter(Boolean)
    .join(" › ")
  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {tag ? <span className="truncate">{tag}</span> : null}
        <span>·</span>
        <span>Diff {question.difficulty}/5</span>
        <span>·</span>
        <span>~{optimalSec}s</span>
        {question.source ? <><span>·</span><span>{question.source}</span></> : null}
      </div>

      {question.question_image_url ? (
        <div className="overflow-hidden rounded-md border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.question_image_url}
            alt="Question"
            loading="lazy"
            className="w-full object-contain max-h-[420px]"
          />
        </div>
      ) : null}
      {question.question_text ? (
        <MathPreview value={question.question_text} />
      ) : null}
    </div>
  )
}

// ---------- ResultPanel ----------

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
  approach: ApproachId
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
        icon: <div className="inline-flex size-10 items-center justify-center rounded-full bg-sky-500/15"><Circle className="size-5 text-sky-500" /></div>,
        text: "No problem — here's how to approach this",
        tone: "text-sky-600",
        bg: "bg-sky-500/5 border-sky-500/20",
      }
    : isCorrect === true
      ? {
          icon: <div className="inline-flex size-10 items-center justify-center rounded-full bg-emerald-500/15"><CheckCircle2 className="size-5 text-emerald-600" /></div>,
          text: "Correct!",
          tone: "text-emerald-700",
          bg: "bg-emerald-500/5 border-emerald-500/20",
        }
      : isCorrect === false
        ? {
            icon: <div className="inline-flex size-10 items-center justify-center rounded-full bg-red-500/15"><XCircle className="size-5 text-red-600" /></div>,
            text: "Not quite",
            tone: "text-red-700",
            bg: "bg-red-500/5 border-red-500/20",
          }
        : {
            icon: <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10"><Check className="size-5 text-primary" /></div>,
            text: "Answer submitted",
            tone: "text-primary",
            bg: "bg-primary/5 border-primary/20",
          }

  const timeCopy = skipped
    ? null
    : timeDelta <= -5
      ? `Well under par (optimal ~${fmt(optimalSec)})`
      : timeDelta <= 5
        ? `Right on pace (~${fmt(optimalSec)})`
        : `Over par by ${fmt(Math.abs(timeDelta))}`

  return (
    <div className="mt-4 grid gap-5">
      {/* Result banner */}
      <div className={cn("flex items-center gap-3 rounded-xl border p-4", headline.bg)}>
        {headline.icon}
        <div className="min-w-0 flex-1">
          <h2 className={cn("text-lg font-semibold", headline.tone)}>{headline.text}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fmt(takenSec)}{timeCopy ? ` · ${timeCopy}` : ""}
          </p>
        </div>
      </div>

      <CorrectAnswerReveal question={question} answer={answer} isCorrect={isCorrect} skipped={skipped} />

      <section className="grid gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reasoning-first solutions
        </h3>
        <SolutionTabs solutions={solutions} />
      </section>

      {/* Sticky bottom action bar — plain bg (no backdrop-filter on page-level elements) */}
      <div className="sticky bottom-0 -mx-4 border-t bg-background px-4 py-3 md:-mx-6 md:px-6">
        <div className="flex gap-2">
          <LoadingButton
            onClick={onNext}
            loading={pendingNext}
            loadingText="Loading…"
            className="flex-1 min-h-[48px]"
          >
            Next question
          </LoadingButton>
          <LoadingButton
            variant="outline"
            onClick={onEnd}
            loading={pendingEnd}
            loadingText="Ending…"
            className="flex-1 min-h-[48px]"
          >
            End session
          </LoadingButton>
        </div>
        <p className="mt-1 hidden text-center text-xs text-muted-foreground md:block">
          Press Enter for the next question
        </p>
      </div>
    </div>
  )
}

// ---------- CorrectAnswerReveal ----------

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

  if (
    (question.question_type === "single_correct" || question.question_type === "multi_correct") &&
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
                "flex min-h-[48px] items-center gap-3 rounded-xl border px-3 py-2.5",
                isCorrectOpt
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : isUserPick
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border bg-card"
              )}
            >
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold">
                {letter}
              </span>
              <div className="min-w-0 flex-1">
                <MathPreview value={opt.text} block={false} />
              </div>
              {isCorrectOpt ? (
                <Badge className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-600 text-xs">✓</Badge>
              ) : isUserPick && !skipped && isCorrect === false ? (
                <Badge variant="destructive" className="shrink-0 text-xs">✗</Badge>
              ) : null}
            </div>
          )
        })}
      </div>
    )
  }

  if (correct.type === "numerical") {
    const userVal = answer && answer.type === "numerical" ? answer.value : null
    return (
      <div className="rounded-xl border bg-card px-4 py-3 text-sm">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Correct answer
        </div>
        <div className="mt-1 text-xl font-semibold tabular-nums">
          {correct.value}
          {correct.tolerance != null ? (
            <span className="text-sm text-muted-foreground"> (± {correct.tolerance})</span>
          ) : null}
        </div>
        {userVal != null && !skipped ? (
          <div className="mt-1 text-xs text-muted-foreground">
            You entered:{" "}
            <span className={cn("font-mono font-semibold", isCorrect ? "text-emerald-600" : "text-red-600")}>
              {userVal}
            </span>
          </div>
        ) : null}
      </div>
    )
  }

  if (correct.type === "subjective") {
    return (
      <div className="rounded-xl border bg-card p-4">
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

// ---------- ExhaustedPanel ----------

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
    <div className="mx-auto mt-16 max-w-md text-center">
      <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
      <h2 className="mt-4 text-xl font-semibold tracking-tight">
        You&apos;ve worked through every question in scope.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        End this session to see your summary — or pick another topic.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <LoadingButton
          onClick={onEnd}
          loading={pendingEnd}
          loadingText="Ending…"
          className="w-full min-h-[48px] sm:w-auto"
        >
          End session
        </LoadingButton>
        <Button render={<Link href="/practice" />} variant="outline" className="w-full min-h-[48px] sm:w-auto">
          Switch topic
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Session: {sessionId.slice(0, 8)}
      </p>
    </div>
  )
}
