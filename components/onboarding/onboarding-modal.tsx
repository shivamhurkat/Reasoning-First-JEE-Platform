"use client"

import { useState, useTransition } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { saveOnboarding, type OnboardingData } from "./actions"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type UserType = "student" | "teacher" | "contributor" | "parent" | "other"

interface OnboardingModalProps {
  userName: string
}

// ─────────────────────────────────────────────
// Step 1: Who are you?
// ─────────────────────────────────────────────

const USER_TYPE_OPTIONS: {
  value: UserType
  emoji: string
  label: string
  sub: string
}[] = [
    { value: "student", emoji: "🎓", label: "Student", sub: "Preparing for competitive exams" },
    { value: "teacher", emoji: "👨‍🏫", label: "Teacher", sub: "I teach JEE/NEET subjects" },
    { value: "contributor", emoji: "🏆", label: "Contributor", sub: "Cleared JEE/NEET, here to share shortcuts" },
    { value: "parent", emoji: "👨‍👩‍👧", label: "Parent", sub: "Tracking my child's prep" },
    { value: "other", emoji: "🔍", label: "Just Exploring", sub: "Checking things out" },
  ]

// ─────────────────────────────────────────────
// Reusable SelectCard
// ─────────────────────────────────────────────

function SelectCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full rounded-xl border text-left transition-all duration-150 min-h-[56px] px-4 py-3",
        "hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card",
        className
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 inline-flex size-5 items-center justify-center rounded-full bg-primary text-white">
          <Check className="size-3" />
        </span>
      )}
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────
// Progress Dots
// ─────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i === current
              ? "w-6 h-2 bg-primary"
              : i < current
                ? "w-2 h-2 bg-primary/40"
                : "w-2 h-2 bg-muted-foreground/20"
          )}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 2 — Student
// ─────────────────────────────────────────────

const EXAMS = ["JEE Mains", "JEE Advanced", "NEET"]

// UI label → DB value mapping (constraint: '11' | '12' | 'dropper')
const CLASS_LEVELS: { label: string; value: string }[] = [
  { label: "Class 11", value: "11" },
  { label: "Class 12", value: "12" },
  { label: "Dropper", value: "dropper" },
]

const TARGET_YEARS = ["2025", "2026", "2027", "2028"]

function StudentStep({
  data,
  onChange,
}: {
  data: Partial<OnboardingData>
  onChange: (d: Partial<OnboardingData>) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Exam */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Which exam?</p>
        <div className="grid grid-cols-3 gap-2">
          {EXAMS.map((exam) => (
            <SelectCard
              key={exam}
              selected={data.target_exam === exam}
              onClick={() => onChange({ ...data, target_exam: exam })}
            >
              <span className="text-sm font-medium leading-snug">{exam}</span>
            </SelectCard>
          ))}
        </div>
      </div>

      {/* Class */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Your class?</p>
        <div className="grid grid-cols-3 gap-2">
          {CLASS_LEVELS.map((cls) => (
            <SelectCard
              key={cls.value}
              selected={data.class_level === cls.value}
              onClick={() => onChange({ ...data, class_level: cls.value })}
            >
              <span className="text-sm font-medium leading-snug">{cls.label}</span>
            </SelectCard>
          ))}
        </div>
      </div>

      {/* Target year */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Target year?</p>
        <select
          value={data.target_year ?? ""}
          onChange={(e) => onChange({ ...data, target_year: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px]"
        >
          <option value="">Select year</option>
          {TARGET_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Coaching institute */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Coaching institute <span className="normal-case font-normal tracking-normal text-muted-foreground/60">(optional)</span>
        </p>
        <input
          type="text"
          placeholder="e.g., Allen, FIITJEE, Aakash"
          value={data.coaching_institute ?? ""}
          onChange={(e) => onChange({ ...data, coaching_institute: e.target.value })}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px] placeholder:text-muted-foreground/50"
        />
      </div>

      {/* City */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          City <span className="normal-case font-normal tracking-normal text-muted-foreground/60">(optional)</span>
        </p>
        <input
          type="text"
          placeholder="e.g., Delhi, Kota, Mumbai"
          value={data.city ?? ""}
          onChange={(e) => onChange({ ...data, city: e.target.value })}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px] placeholder:text-muted-foreground/50"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 2 — Teacher
// ─────────────────────────────────────────────

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"]

function TeacherStep({
  data,
  onChange,
}: {
  data: Partial<OnboardingData> & { subjects?: string[] }
  onChange: (d: Partial<OnboardingData> & { subjects?: string[] }) => void
}) {
  const selected = data.subjects ?? []

  const toggle = (subj: string) => {
    const next = selected.includes(subj)
      ? selected.filter((s) => s !== subj)
      : [...selected, subj]
    onChange({ ...data, subjects: next })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Subjects you teach</p>
        <div className="grid grid-cols-2 gap-2">
          {SUBJECTS.map((s) => (
            <SelectCard key={s} selected={selected.includes(s)} onClick={() => toggle(s)}>
              <span className="text-sm font-medium">{s}</span>
            </SelectCard>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          City <span className="normal-case font-normal tracking-normal text-muted-foreground/60">(optional)</span>
        </p>
        <input
          type="text"
          placeholder="e.g., Delhi, Kota, Mumbai"
          value={data.city ?? ""}
          onChange={(e) => onChange({ ...data, city: e.target.value })}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px] placeholder:text-muted-foreground/50"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 2 — Contributor
// ─────────────────────────────────────────────

const CLEARED_EXAMS = ["JEE Mains", "JEE Advanced", "NEET", "Other"]

function ContributorStep({
  data,
  onChange,
}: {
  data: Partial<OnboardingData> & { year_cleared?: string }
  onChange: (d: Partial<OnboardingData> & { year_cleared?: string }) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Which exam did you clear?</p>
        <div className="grid grid-cols-2 gap-2">
          {CLEARED_EXAMS.map((exam) => (
            <SelectCard
              key={exam}
              selected={data.target_exam === exam}
              onClick={() => onChange({ ...data, target_exam: exam })}
            >
              <span className="text-sm font-medium">{exam}</span>
            </SelectCard>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Year cleared</p>
        <input
          type="number"
          placeholder="e.g., 2023"
          value={data.year_cleared ?? ""}
          onChange={(e) => onChange({ ...data, year_cleared: e.target.value })}
          min={2010}
          max={2030}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px] placeholder:text-muted-foreground/50"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 3 — Done
// ─────────────────────────────────────────────

const DONE_MESSAGES: Record<UserType, string> = {
  student: "Your practice journey starts now. Let's build that rank! 🚀",
  teacher: "Thank you for being here. Your insights make every student better. 🌟",
  contributor: "Your shortcuts will save thousands of hours. Legend! 🏆",
  parent: "Stay in the loop. We'll help you support your child's prep. 💪",
  other: "Explore away! There's a lot of good stuff here. 🔍",
}

function DoneStep({ userType, userName }: { userType: UserType; userName: string }) {
  const msg = DONE_MESSAGES[userType] ?? "Welcome aboard! Let's get started. 🎉"
  return (
    <div className="flex flex-col items-center text-center gap-4 py-4">
      <div className="text-5xl">🎉</div>
      <div>
        <h3 className="text-lg font-semibold">You&apos;re all set, {userName}!</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">{msg}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────

type ExtData = Partial<OnboardingData> & { subjects?: string[]; year_cleared?: string }

export function OnboardingModal({ userName }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [stepData, setStepData] = useState<ExtData>({})
  const [isPending, startTransition] = useTransition()

  // Compute total steps
  const needsStep2 = userType === "student" || userType === "teacher" || userType === "contributor"
  const totalSteps = needsStep2 ? 3 : 2

  const doSave = (extraData: Partial<OnboardingData> = {}) => {
    startTransition(async () => {
      const payload: OnboardingData = {
        user_type: userType ?? undefined,
        ...stepData,
        ...extraData,
      }
      // Remove non-db keys
      const { subjects: _s, year_cleared: _y, ...dbPayload } = payload as ExtData
      void _s; void _y

      const result = await saveOnboarding(dbPayload)
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong. Please try again.")
      }
      // On success, revalidatePath triggers a server re-render;
      // the modal won't re-appear because onboarding_completed=true in DB.
    })
  }

  const handleSkip = () => {
    doSave({ user_type: userType ?? undefined })
  }

  const handleNext = () => {
    if (step === 0) {
      // Moving from type selection
      if (!needsStep2) {
        // parent / other → skip to done
        setStep(2)
      } else {
        setStep(1)
      }
    } else if (step === 1) {
      setStep(2)
    } else {
      // step 2 = done, clicking "Let's Go"
      doSave()
    }
  }

  const firstName = userName.split(" ")[0]

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred dashboard behind */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl border border-border overflow-hidden flex flex-col"
        style={{ maxHeight: "calc(100dvh - 32px)" }}
      >
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8">
          <ProgressDots total={totalSteps} current={step === 2 && !needsStep2 ? 1 : step} />

          {/* ── STEP 0: User type ── */}
          {step === 0 && (
            <div
              className="onboarding-step"
              style={{ animation: "onboarding-in 200ms ease-out" }}
            >
              <h2 className="text-xl font-bold text-center mb-1">Welcome to ReasonLab!</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">Tell us a bit about yourself</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {USER_TYPE_OPTIONS.map((opt) => (
                  <SelectCard
                    key={opt.value}
                    selected={userType === opt.value}
                    onClick={() => setUserType(opt.value)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">{opt.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                      </div>
                    </div>
                  </SelectCard>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: Conditional details ── */}
          {step === 1 && userType === "student" && (
            <div className="onboarding-step" style={{ animation: "onboarding-in 200ms ease-out" }}>
              <h2 className="text-lg font-bold mb-5">A bit more about your prep</h2>
              <StudentStep data={stepData} onChange={setStepData} />
            </div>
          )}

          {step === 1 && userType === "teacher" && (
            <div className="onboarding-step" style={{ animation: "onboarding-in 200ms ease-out" }}>
              <h2 className="text-lg font-bold mb-5">About your teaching</h2>
              <TeacherStep data={stepData} onChange={setStepData} />
            </div>
          )}

          {step === 1 && userType === "contributor" && (
            <div className="onboarding-step" style={{ animation: "onboarding-in 200ms ease-out" }}>
              <h2 className="text-lg font-bold mb-5">Your JEE/NEET journey</h2>
              <ContributorStep data={stepData} onChange={setStepData} />
            </div>
          )}

          {/* ── STEP 2 (or 1 for parent/other): Done ── */}
          {step === 2 && (
            <div className="onboarding-step" style={{ animation: "onboarding-in 200ms ease-out" }}>
              <DoneStep userType={userType ?? "other"} userName={firstName} />
            </div>
          )}
        </div>

        {/* Footer — always visible */}
        <div className="border-t border-border px-6 sm:px-8 py-4 flex flex-col gap-2 bg-background">
          {step < 2 ? (
            <>
              <button
                type="button"
                disabled={step === 0 && !userType}
                onClick={handleNext}
                className={cn(
                  "w-full rounded-xl bg-primary text-primary-foreground font-semibold text-sm py-3 min-h-[48px]",
                  "transition-all duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                Next →
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={isPending}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1 min-h-[36px]"
              >
                Skip for now
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleNext}
                disabled={isPending}
                className={cn(
                  "w-full rounded-xl bg-primary text-primary-foreground font-semibold text-sm py-3 min-h-[48px]",
                  "transition-all duration-150 hover:opacity-90 disabled:opacity-50"
                )}
              >
                {isPending ? "Saving…" : "Let's Go 🚀"}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={isPending}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1 min-h-[36px]"
              >
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>

      {/* Keyframe styles injected inline */}
      <style>{`
        @keyframes onboarding-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
