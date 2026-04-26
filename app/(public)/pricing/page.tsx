import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Sparkles,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Pricing — RankersKit",
  description:
    "Simple, transparent credit-based pricing. Start free with 50 credits/month or go Pro with 1000 credits/month for ₹99.",
}

export default function PricingPage() {
  return (
    <>
      {/* Ambient background glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#7900cd]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#4b8eff]/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 pt-12 pb-20 px-4 sm:px-6 flex flex-col items-center min-h-[80vh]">
        {/* Early access banner */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ffb77d]/30 bg-[#ffb77d]/10 text-[#ffb77d] mb-8 backdrop-blur-sm">
          <Sparkles className="size-3.5" />
          <span className="text-xs font-semibold">
            Currently in early access — all features free during beta
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
            Invest in your{" "}
            <span className="bg-gradient-to-r from-[#adc6ff] to-[#ddb7ff] bg-clip-text text-transparent">
              performance.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[#c1c6d7] leading-relaxed">
            Simple, transparent pricing for high-achievers. Choose the plan that
            accelerates your journey.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* Free Plan */}
          <div className="bg-[#1a1c20] border border-[#414755]/30 rounded-xl p-8 flex flex-col relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
            <div
              aria-hidden
              className="absolute inset-0 shadow-[inset_1px_1px_0px_0px_rgba(255,255,255,0.05)]"
            />
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#e2e2e8] mb-1">
                  Free Plan
                </h2>
                <p className="text-sm text-[#c1c6d7]">
                  Get started and explore the platform
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-[#e2e2e8]">
                    50 Credits
                  </span>
                  <span className="text-sm text-[#c1c6d7]">/month</span>
                </div>
                <div className="mt-2 text-sm text-[#c1c6d7] font-medium">
                  ₹0 / month ·{" "}
                  <span className="text-[#adc6ff]/80">1 question = 1 credit</span>
                </div>
              </div>

              <div className="flex-grow">
                <ul className="space-y-3 opacity-80">
                  <FeatureItem icon={<Check className="size-4 text-[#adc6ff]" />}>
                    Limited question practice using credits
                  </FeatureItem>
                  <FeatureItem icon={<Check className="size-4 text-[#adc6ff]" />}>
                    Access to basic solutions
                  </FeatureItem>
                  <FeatureItem icon={<Check className="size-4 text-[#adc6ff]" />}>
                    Community / Shortcut Library access
                  </FeatureItem>
                </ul>
              </div>

              <div className="mt-8 pt-8 border-t border-[#414755]/30">
                <Link
                  href="/signup"
                  className="w-full py-3 px-6 rounded-lg border border-[#414755] text-[#e2e2e8] hover:bg-[#333539] transition-colors text-sm font-medium flex items-center justify-center min-h-[48px]"
                >
                  Start Free
                </Link>
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-[#1e2024] border border-[#adc6ff]/40 rounded-xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_40px_-15px_rgba(75,142,255,0.2)] transition-transform hover:-translate-y-1 duration-300">
            <div
              aria-hidden
              className="absolute -top-20 -right-20 w-40 h-40 bg-[#adc6ff]/15 blur-[50px] rounded-full pointer-events-none"
            />
            <div className="absolute top-0 right-0 bg-[#adc6ff] text-[#002e69] px-3 py-1 rounded-bl-lg text-xs font-semibold uppercase tracking-wider">
              Recommended
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#adc6ff] mb-1">
                  Pro Plan
                </h2>
                <p className="text-sm text-[#c1c6d7]">
                  For serious aspirants who want an edge
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-[#e2e2e8]">
                    1000 Credits
                  </span>
                  <span className="text-sm text-[#c1c6d7]">/month</span>
                </div>
                <div className="mt-2 text-sm text-[#c1c6d7] font-medium">
                  ₹99 / month ·{" "}
                  <span className="text-[#adc6ff]/80">1 question = 1 credit</span>
                </div>
              </div>

              <div className="flex-grow">
                <ul className="space-y-3 opacity-80">
                  <FeatureItem
                    icon={<CheckCircle2 className="size-4 text-[#adc6ff]" />}
                  >
                    Large credit pool for daily practice
                  </FeatureItem>
                  <FeatureItem
                    icon={<CheckCircle2 className="size-4 text-[#adc6ff]" />}
                  >
                    Full access to shortcut solutions
                  </FeatureItem>
                  <FeatureItem
                    icon={<CheckCircle2 className="size-4 text-[#adc6ff]" />}
                  >
                    Advanced insights & performance tracking
                  </FeatureItem>
                </ul>
              </div>

              <div className="mt-8 pt-8 border-t border-[#414755]/30">
                <Link
                  href="/signup"
                  className="w-full py-3 px-6 rounded-lg bg-[#adc6ff] text-[#002e69] hover:bg-[#d8e2ff] transition-colors text-sm font-semibold flex items-center justify-center gap-2 min-h-[48px] hover:shadow-[0_0_20px_rgba(75,142,255,0.3)]"
                >
                  Subscribe to Pro
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Credit explanation */}
        <div className="mt-12 max-w-xl mx-auto text-center">
          <p className="text-sm text-[#8b90a0]">
            Credits refresh monthly. 1 question = 1 credit. Unused credits do not
            roll over. Payment integration coming soon — during beta, all features
            are free.
          </p>
        </div>
      </main>
    </>
  )
}

function FeatureItem({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-sm text-[#e2e2e8]">{children}</span>
    </li>
  )
}
