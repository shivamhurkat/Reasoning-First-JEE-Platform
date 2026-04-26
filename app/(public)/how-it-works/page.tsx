import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Gamepad2,
  Search,
  Route,
  TrendingUp,
  Diamond,
} from "lucide-react"

export const metadata: Metadata = {
  title: "How It Works — RankersKit",
  description:
    "A relentless cycle of execution, analysis, and strategic shortcuts — the methodology that engineers an unfair advantage for JEE.",
}

const STEPS = [
  {
    number: "01",
    icon: Gamepad2,
    title: "Train for Speed. Eliminate Guesswork.",
    description:
      "Immerse yourself in hyper-realistic, high-pressure simulated environments. Practice real JEE questions organized by subject, chapter, and topic. Execution becomes reflex.",
    color: "text-[#adc6ff]",
    borderHover: "hover:border-[#adc6ff]/30",
    glowColor: "from-[#adc6ff]/5",
    span: "md:col-span-7",
  },
  {
    number: "02",
    icon: Search,
    title: "Expose Weakness. Optimize Every Second.",
    description:
      "Brutal, unbiased dissection of your performance. We isolate your weak topics and track accuracy, speed, and consistency so you know exactly where to focus.",
    color: "text-[#ddb7ff]",
    borderHover: "hover:border-[#ddb7ff]/30",
    glowColor: "from-[#ddb7ff]/5",
    span: "md:col-span-5",
  },
  {
    number: "03",
    icon: Route,
    title: "Bypass the Standard. Master the Shortcut.",
    description:
      "Access the proprietary frameworks and mental models used by the top 1%. Every question teaches both the ideal solution and the smart shortcut that saves minutes.",
    color: "text-[#ffb77d]",
    borderHover: "hover:border-[#ffb77d]/30",
    glowColor: "from-[#ffb77d]/5",
    span: "md:col-span-5",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Think Like a Ranker. Dominate the Exam.",
    description:
      "Re-enter the arena with upgraded capacity. The cycle repeats, pushing your baseline performance into the realm of the elite. Spaced repetition ensures nothing is forgotten.",
    color: "text-[#4b8eff]",
    borderHover: "hover:border-[#4b8eff]/50",
    glowColor: "from-[#4b8eff]/5",
    span: "md:col-span-7",
  },
]

export default function HowItWorksPage() {
  return (
    <>
      {/* Ambient background glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#7900cd]/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#4b8eff]/10 blur-[150px]" />
      </div>

      <main className="relative z-10 pt-12 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-20">
          {/* Hero */}
          <section className="text-center pt-8 pb-4">
            <div className="inline-block mb-4">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ddb7ff] px-3 py-1 rounded-full border border-[#ddb7ff]/20 bg-[#ddb7ff]/5">
                The Methodology
              </span>
            </div>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4"
              style={{ textShadow: "0 0 20px rgba(173,198,255,0.3)" }}
            >
              Engineer Your{" "}
              <span className="bg-gradient-to-r from-[#adc6ff] to-[#ddb7ff] bg-clip-text text-transparent">
                Advantage
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#c1c6d7] max-w-2xl mx-auto leading-relaxed">
              We don&apos;t teach. We condition. A relentless cycle of execution,
              microscopic analysis, and strategic bypassing designed to construct an
              insurmountable edge over the competition.
            </p>
          </section>

          {/* Steps Grid */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className={`${step.span} rounded-xl border border-white/5 bg-[#1e2024]/40 p-8 relative group overflow-hidden transition-all duration-500 ${step.borderHover}`}
              >
                <div
                  aria-hidden
                  className={`absolute inset-0 bg-gradient-to-br ${step.glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="mb-10 flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-[#111318] flex items-center justify-center border border-white/5 shadow-inner">
                      <step.icon className={`size-6 ${step.color}`} />
                    </div>
                    <span
                      className={`text-5xl sm:text-6xl font-black opacity-20 select-none ${step.color}`}
                      style={{ textShadow: "0 0 20px rgba(173,198,255,0.3)" }}
                    >
                      {step.number}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{step.title}</h2>
                    <p className="text-sm text-[#c1c6d7] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* The Edge CTA */}
          <section className="border-t border-white/5 pt-20">
            <div className="rounded-xl border border-white/10 bg-[#1e2024]/40 p-8 sm:p-12 text-center relative overflow-hidden">
              <div
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#adc6ff]/50 to-transparent"
              />
              <Diamond className="mx-auto mb-4 size-10 text-[#414755]" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                The Delta is Everything.
              </h2>
              <p className="text-base sm:text-lg text-[#c1c6d7] max-w-3xl mx-auto mb-10 leading-relaxed">
                Standard preparation yields standard results. The RankersKit
                methodology is engineered specifically to widen the delta between you
                and the mean. It is the architecture of an unfair advantage.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#adc6ff] text-[#002e69] px-8 py-4 rounded-lg text-base font-semibold uppercase tracking-widest hover:shadow-[0_0_30px_rgba(173,198,255,0.3)] transition-all duration-300 min-h-[48px]"
              >
                Start Practicing Now
                <ArrowRight className="size-5" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
