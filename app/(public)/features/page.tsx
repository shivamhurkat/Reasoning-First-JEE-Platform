import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Route,
  Radar,
  Brain,
  RefreshCw,
  Smartphone,
  Trophy,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Features — RankersKit",
  description:
    "Discover the precision-engineered features that give you an unfair advantage for JEE: dual solutions, weak area identification, pattern recognition, and spaced repetition.",
}

const FEATURES = [
  {
    icon: Route,
    title: "Ideal vs Shortcut Learning System",
    description:
      "Master the foundations, then exploit the loopholes. We teach the comprehensive 'ideal' method alongside high-speed 'shortcuts' to give you tactical superiority in any scenario.",
    span: "md:col-span-8",
    color: "text-[#adc6ff]",
    glowFrom: "from-[#adc6ff]/5",
    borderHover: "hover:border-[#adc6ff]/30",
    visual: (
      <div className="mt-6 flex gap-4">
        <div className="flex-1 bg-[#282a2e] p-4 rounded-lg border border-white/5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#333539]" />
          <span className="text-xs text-[#c1c6d7] uppercase font-semibold tracking-wider">
            Ideal Path
          </span>
          <div className="h-2 w-full bg-[#333539] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#414755] w-full" />
          </div>
        </div>
        <div className="flex-1 bg-[#282a2e] p-4 rounded-lg border border-[#adc6ff]/20 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#adc6ff]" />
          <span className="text-xs text-[#adc6ff] uppercase font-semibold tracking-wider">
            Shortcut
          </span>
          <div className="h-2 w-full bg-[#333539] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#adc6ff] to-[#ddb7ff] w-2/3" />
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Radar,
    title: "Weak Area Identification",
    description:
      "Surgical precision diagnostics. Our analytics isolate your vulnerabilities instantly, turning your blind spots into your greatest strengths.",
    span: "md:col-span-4",
    color: "text-red-400",
    glowFrom: "from-red-500/5",
    borderHover: "hover:border-red-400/30",
    visual: null,
  },
  {
    icon: Brain,
    title: "Pattern Recognition",
    description:
      "Train your brain to see the matrix. Rapid-fire drills designed to instill subconscious recognition of recurring problem structures.",
    span: "md:col-span-4",
    color: "text-[#ddb7ff]",
    glowFrom: "from-[#ddb7ff]/5",
    borderHover: "hover:border-[#ddb7ff]/30",
    visual: null,
  },
  {
    icon: RefreshCw,
    title: "Smart Revision (Spaced Repetition)",
    description:
      "Never review blindly again. An algorithmic spaced-repetition engine that dictates exactly what you need to review, and precisely when, to guarantee permanent retention.",
    span: "md:col-span-8",
    color: "text-[#adc6ff]",
    glowFrom: "from-[#adc6ff]/5",
    borderHover: "hover:border-[#adc6ff]/30",
    visual: null,
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description:
      "Built for the way you actually study — on your phone, between classes, on the bus. Every interaction is optimized for touch and designed for 380px screens.",
    span: "md:col-span-6",
    color: "text-blue-400",
    glowFrom: "from-blue-500/5",
    borderHover: "hover:border-blue-400/30",
    visual: null,
  },
  {
    icon: Trophy,
    title: "Daily Challenges & Streaks",
    description:
      "Build consistency with daily challenges that keep your streak alive. XP rewards for correct answers and smart approaches keep you motivated.",
    span: "md:col-span-6",
    color: "text-orange-400",
    glowFrom: "from-orange-500/5",
    borderHover: "hover:border-orange-400/30",
    visual: null,
  },
]

export default function FeaturesPage() {
  return (
    <>
      {/* Ambient background glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#7900cd]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#4b8eff]/10 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 pt-12 pb-20 px-4 sm:px-6">
        {/* Hero */}
        <section className="max-w-5xl mx-auto text-center flex flex-col items-center gap-6 mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ddb7ff] px-3 py-1 rounded-full border border-[#ddb7ff]/30 bg-[#ddb7ff]/10">
            The Elite Edge
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-4xl">
            Precision-Engineered for{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#adc6ff] to-[#ddb7ff] bg-clip-text text-transparent">
              Peak Performance
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[#c1c6d7] max-w-2xl mx-auto leading-relaxed">
            Stop guessing. Start optimizing. RankersKit breaks down complex learning
            into a systematic, data-driven approach designed exclusively for the top 1%.
          </p>
        </section>

        {/* Bento Grid Features */}
        <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 mb-20">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`${feature.span} rounded-xl border border-white/5 bg-[#1e2024]/40 backdrop-blur-sm p-8 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 ${feature.borderHover}`}
            >
              <div
                aria-hidden
                className={`absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l ${feature.glowFrom} to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="z-10 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#111318] flex items-center justify-center border border-white/5 shadow-lg">
                  <feature.icon className={`size-5 ${feature.color}`} />
                </div>
                <h2 className="text-xl font-semibold mt-3">{feature.title}</h2>
                <p className="text-sm text-[#c1c6d7] max-w-md leading-relaxed">
                  {feature.description}
                </p>
              </div>
              {feature.visual && (
                <div className="z-10">{feature.visual}</div>
              )}
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="max-w-2xl mx-auto text-center">
          <div className="rounded-xl border border-white/10 bg-[#1e2024]/60 backdrop-blur p-8 sm:p-12 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#adc6ff]/50 to-transparent"
            />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Experience the difference.
            </h2>
            <p className="text-[#c1c6d7] mb-8">
              Join the elite students who practice smarter, not harder.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#adc6ff] text-[#002e69] px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-[0_0_30px_rgba(173,198,255,0.3)] transition-all duration-300 min-h-[48px]"
            >
              Get Started Free
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
