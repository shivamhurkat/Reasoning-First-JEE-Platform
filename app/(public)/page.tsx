import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Lightbulb,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { getDailyQuote } from "@/lib/constants/quotes"

export const metadata: Metadata = {
  title: "ReasonLab — Reasoning-First JEE Practice",
  description:
    "Practice JEE questions with dual solutions: the ideal approach and the shortcut. Track progress, fix weak areas, and think smarter.",
  keywords: [
    "JEE preparation",
    "JEE practice",
    "JEE shortcuts",
    "JEE Mains",
    "JEE Advanced",
    "reasoning",
    "IIT JEE",
  ],
  openGraph: {
    title: "ReasonLab — Think Smarter for JEE",
    description:
      "Every question teaches you the textbook solution AND the shortcut.",
    type: "website",
  },
}

export const dynamic = "force-dynamic"

export default async function LandingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  const [questionsRes, usersRes] = await Promise.all([
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true }),
  ])

  const questionCount = questionsRes.count ?? 0
  const userCount = usersRes.count ?? 0

  const roundedQuestions = Math.max(0, Math.floor(questionCount / 10) * 10)
  const roundedUsers = Math.max(0, Math.floor(userCount / 10) * 10)

  const quote = getDailyQuote()

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.46_0.22_264/0.08),transparent)]"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3" />
            Reasoning-first JEE practice
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Don&apos;t just solve.{" "}
            <span className="text-primary">Think smarter.</span>
          </h1>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            The reasoning-first practice platform for JEE. Every question teaches
            you the ideal solution AND the shortcut.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto min-h-[48px] text-base" render={<Link href="/signup" />}>
              Start Practicing Free
              <ArrowRight className="ml-1 size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto min-h-[48px] text-base"
              render={<a href="#how-it-works" />}
            >
              See How It Works
            </Button>
          </div>
        </div>

        {/* Mock practice UI */}
        <div className="mx-auto mt-12 max-w-sm rounded-2xl border bg-card shadow-lg overflow-hidden">
          <div className="border-b bg-muted/40 px-4 py-3 flex items-center gap-2">
            <div className="size-2.5 rounded-full bg-destructive/60" />
            <div className="size-2.5 rounded-full bg-warning/60" />
            <div className="size-2.5 rounded-full bg-success/60" />
            <span className="ml-2 text-xs font-medium text-muted-foreground">Practice Session</span>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium leading-snug">
              A particle moves in a circle of radius <span className="font-mono text-primary">r</span>.
              Find the centripetal acceleration when speed is <span className="font-mono text-primary">v</span>.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["v²/r", "v/r²", "v²r", "r/v²"].map((opt, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 text-sm text-center cursor-default ${
                    i === 0
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
              <p className="text-xs font-semibold text-primary flex items-center gap-1">
                <Zap className="size-3" /> Shortcut
              </p>
              <p className="text-xs text-muted-foreground">Dimensional analysis: [v²/r] = [m/s²] ✓. Pick it in 5 seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="px-4 py-16 bg-muted/30">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Three steps to sharper JEE reasoning.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Step
              number={1}
              icon={<BookOpen className="size-5" />}
              title="Practice real JEE questions"
              description="Curated questions from JEE Mains and Advanced, organized by subject, chapter, and topic."
            />
            <Step
              number={2}
              icon={<Zap className="size-5" />}
              title="See the ideal solution AND the shortcut"
              description="Every question has the textbook method plus the smart, time-saving approach top rankers actually use."
            />
            <Step
              number={3}
              icon={<BarChart3 className="size-5" />}
              title="Track progress, fix weak areas"
              description="See exactly which topics need work. Wrong answers come back until you master them."
            />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-3 gap-4 rounded-2xl border bg-card p-6">
            <Stat value={`${roundedQuestions}+`} label="Questions" />
            <Stat value="3" label="Subjects" />
            <Stat value="100%" label="Have shortcuts" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Everything you need to crack JEE
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Zap className="size-5 text-primary" />}
              title="Dual Solutions"
              description="See the textbook way and the smart way for every question. Know both, choose fast."
            />
            <FeatureCard
              icon={<CheckCircle2 className="size-5 text-success" />}
              title="Spaced Repetition"
              description="Wrong answers come back at the right time until you master them for good."
            />
            <FeatureCard
              icon={<CalendarDays className="size-5 text-accent-warm" />}
              title="Daily Challenges"
              description="5 questions every day to keep your streak alive and build consistency."
            />
            <FeatureCard
              icon={<BarChart3 className="size-5 text-info" />}
              title="Progress Analytics"
              description="See exactly where you're strong and where to spend your next study hour."
            />
            <FeatureCard
              icon={<Smartphone className="size-5 text-subject-physics" />}
              title="Works on Your Phone"
              description="Built mobile-first for studying anywhere — on the bus, between classes, everywhere."
            />
            <FeatureCard
              icon={<Lightbulb className="size-5 text-subject-math" />}
              title="Free to Start"
              description="No credit card needed. Practice 10 questions per day, completely free."
            />
          </div>
        </div>
      </section>

      {/* ── DAILY MOTIVATION ── */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-xl text-center">
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-transparent to-transparent p-6">
            <Sparkles className="mx-auto mb-3 size-5 text-primary" />
            <blockquote className="text-lg font-medium leading-snug text-balance">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <p className="mt-2 text-sm text-muted-foreground">— {quote.author}</p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to think smarter?
          </h2>
          <p className="mt-2 text-muted-foreground">
            {roundedUsers > 0
              ? `Join ${roundedUsers}+ students already practicing.`
              : "Start your JEE prep the smart way."}
          </p>
          <Button
            size="lg"
            className="mt-6 min-h-[48px] w-full sm:w-auto text-base"
            render={<Link href="/signup" />}
          >
            Start Free
            <ArrowRight className="ml-1 size-4" />
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card required. Free forever.
          </p>
        </div>
      </section>
    </>
  )
}

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: number
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-bold text-primary">0{number}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
