import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Zap,
  Sparkles,
  TimerOff,
  Dumbbell,
  TrendingDown,
  PlayCircle,
  Rocket,
  Users,
  GraduationCap,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getDailyQuote } from "@/lib/constants/quotes"

export const metadata: Metadata = {
  title: "RankersKit — Think Like a Ranker",
  description:
    "Practice JEE questions with dual solutions: the ideal approach and the shortcut. Master the shortcuts that separate the top 1% from the rest.",
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
    title: "RankersKit — Think Like a Ranker",
    description:
      "Every question teaches you the fastest way — not just the textbook way.",
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
      <section className="relative overflow-hidden px-4 sm:px-6 min-h-[90vh] flex flex-col items-center justify-center">
        {/* Background grid pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-50 z-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Ambient glow */}
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none z-0"
          style={{
            background: "radial-gradient(circle, rgba(173,198,255,0.15) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/30 bg-blue-400/10 text-blue-300 mb-8 backdrop-blur-sm">
            <Zap className="size-3.5" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Elite Problem Solving
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Don&apos;t just solve.
            <br />
            <span className="text-[#adc6ff]" style={{ textShadow: "0 0 20px rgba(173,198,255,0.5)" }}>
              Think like a ranker.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#c1c6d7] max-w-2xl mx-auto mb-10 leading-relaxed">
            Every question teaches you the fastest way — not just the textbook way.
            Master the shortcuts that separate the top 1% from the rest.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="bg-[#adc6ff] text-[#002e69] px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-[0_0_20px_rgba(173,198,255,0.4)] transition-all duration-300 text-center min-h-[48px] flex items-center justify-center"
            >
              Start Practicing Free
            </Link>
            <Link
              href="/how-it-works"
              className="border border-[#8b90a0] text-[#e2e2e8] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#333539] transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              <PlayCircle className="size-5" />
              See How It Works
            </Link>
          </div>
        </div>

        {/* Mock practice card */}
        <div className="relative z-10 w-full max-w-lg mx-auto mt-16">
          <div className="rounded-xl p-[1px] shadow-2xl bg-gradient-to-b from-white/10 to-white/0">
            <div className="rounded-xl bg-[#1e2024]/80 backdrop-blur-md p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-red-500/60" />
                <div className="size-2.5 rounded-full bg-yellow-500/60" />
                <div className="size-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-[#8b90a0] font-medium">Practice Session</span>
              </div>
              <p className="text-sm font-medium leading-snug text-[#e2e2e8]">
                A particle moves in a circle of radius{" "}
                <span className="font-mono text-[#adc6ff]">r</span>. Find the centripetal
                acceleration when speed is{" "}
                <span className="font-mono text-[#adc6ff]">v</span>.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["v²/r", "v/r²", "v²r", "r/v²"].map((opt, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border px-3 py-2 text-sm text-center ${
                      i === 0
                        ? "border-[#adc6ff]/50 bg-[#adc6ff]/10 font-medium text-[#adc6ff]"
                        : "border-[#414755] text-[#8b90a0]"
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-[#adc6ff]/20 bg-[#adc6ff]/5 p-3 space-y-1">
                <p className="text-xs font-semibold text-[#adc6ff] flex items-center gap-1">
                  <Zap className="size-3" /> Shortcut
                </p>
                <p className="text-xs text-[#c1c6d7]">
                  Dimensional analysis: [v²/r] = [m/s²] ✓. Pick it in 5 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION ── */}
      <section className="py-20 px-4 sm:px-6 bg-[#0c0e12]">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            The traditional way is failing you.
          </h2>
          <p className="text-base sm:text-lg text-[#c1c6d7] max-w-2xl mx-auto">
            Hard work without efficiency is just exhausting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <ProblemCard
            icon={<TimerOff className="size-7 text-red-400" />}
            iconBg="bg-red-500/10 border-red-500/20"
            title="Wasting Time"
            description="Spending 5 minutes on a problem that has a 30-second shortcut."
          />
          <ProblemCard
            icon={<Dumbbell className="size-7 text-orange-400" />}
            iconBg="bg-orange-500/10 border-orange-500/20"
            title="Brute Forcing"
            description="Relying on raw calculation instead of elegant logic and pattern recognition."
          />
          <ProblemCard
            icon={<TrendingDown className="size-7 text-purple-400" />}
            iconBg="bg-purple-500/10 border-purple-500/20"
            title="Stalled Rank"
            description="Endless practice isn't translating to higher scores in mock tests."
          />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-4 sm:px-6 bg-[#111318]">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-4 rounded-xl border border-white/10 bg-[#1e2024]/60 backdrop-blur p-6 sm:p-8">
            <StatCard
              icon={<BookOpen className="size-5 text-[#adc6ff]" />}
              value={`${roundedQuestions}+`}
              label="Questions"
            />
            <StatCard
              icon={<Users className="size-5 text-purple-400" />}
              value={roundedUsers > 0 ? `${roundedUsers}+` : "—"}
              label="Students"
            />
            <StatCard
              icon={<GraduationCap className="size-5 text-orange-400" />}
              value="3"
              label="Subjects"
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-[#0c0e12]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-purple-300 px-3 py-1 rounded-full border border-purple-400/20 bg-purple-400/5 mb-4">
              The Method
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              How it works
            </h2>
            <p className="text-[#c1c6d7]">
              Three steps to sharper JEE reasoning.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <StepCard
              number="01"
              icon={<BookOpen className="size-5 text-[#adc6ff]" />}
              title="Practice real JEE questions"
              description="Curated questions from JEE Mains and Advanced, organized by subject, chapter, and topic."
              color="text-[#adc6ff]"
            />
            <StepCard
              number="02"
              icon={<Zap className="size-5 text-purple-400" />}
              title="See the ideal solution AND the shortcut"
              description="Every question has the textbook method plus the smart, time-saving approach top rankers actually use."
              color="text-purple-400"
            />
            <StepCard
              number="03"
              icon={<BarChart3 className="size-5 text-orange-400" />}
              title="Track progress, fix weak areas"
              description="See exactly which topics need work. Wrong answers come back until you master them."
              color="text-orange-400"
            />
          </div>
        </div>
      </section>

      {/* ── DAILY MOTIVATION ── */}
      <section className="py-16 px-4 sm:px-6 bg-[#111318]">
        <div className="max-w-xl mx-auto text-center">
          <div className="rounded-xl border border-white/10 bg-[#1e2024]/60 backdrop-blur p-8 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#adc6ff]/50 to-transparent"
            />
            <Sparkles className="mx-auto mb-4 size-5 text-[#adc6ff]" />
            <blockquote className="text-lg font-medium leading-snug text-[#e2e2e8]">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <p className="mt-3 text-sm text-[#8b90a0]">— {quote.author}</p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-4 sm:px-6 bg-[#0c0e12]">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-white/10 bg-[#1e2024]/60 backdrop-blur p-8 sm:p-12 text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#adc6ff]/50 to-transparent"
            />
            <Rocket className="mx-auto mb-4 size-8 text-[#adc6ff]" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Ready to think like a ranker?
            </h2>
            <p className="text-[#c1c6d7] mb-8">
              {roundedUsers > 0
                ? `Join ${roundedUsers}+ students already practicing.`
                : "Start your JEE prep the smart way."}
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#adc6ff] text-[#002e69] px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-[0_0_30px_rgba(173,198,255,0.3)] transition-all duration-300 min-h-[48px]"
            >
              Start Free
              <ArrowRight className="size-5" />
            </Link>
            <p className="mt-4 text-xs text-[#8b90a0]">
              No credit card required. Free during beta.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

function ProblemCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1e2024]/40 backdrop-blur-sm p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-white/10">
      <div className={`w-16 h-16 rounded-full ${iconBg} border flex items-center justify-center mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-sm text-[#c1c6d7]">{description}</p>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="text-center flex flex-col items-center gap-2">
      {icon}
      <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[#e2e2e8]">{value}</p>
      <p className="text-xs text-[#8b90a0]">{label}</p>
    </div>
  )
}

function StepCard({
  number,
  icon,
  title,
  description,
  color,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1e2024]/40 backdrop-blur-sm p-6 flex flex-col transition-all duration-300 hover:border-white/10 group">
      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-lg bg-[#111318] border border-white/5 flex items-center justify-center shadow-inner">
          {icon}
        </div>
        <span className={`text-4xl font-black opacity-20 select-none ${color}`} style={{ textShadow: "0 0 20px rgba(173,198,255,0.3)" }}>
          {number}
        </span>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[#c1c6d7] leading-relaxed">{description}</p>
    </div>
  )
}
