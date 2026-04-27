"use client"

import { useCallback, useState, useTransition } from "react"
import Link from "next/link"
import Script from "next/script"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  CheckCircle2,
  Coins,
  Gift,
  History,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { TopupPackage, ProTierConfig } from "@/lib/queries/config"
import { format } from "date-fns"

type CreditTransaction = {
  id: string
  type: string
  amount: number
  balance_after: number
  description: string | null
  created_at: string
}

type UserData = {
  credit_balance: number
  plan: string
  email: string
}

// ---------- Razorpay helpers ----------

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: any) => { open(): void }
  }
}

async function openRazorpayCheckout({
  amount_inr,
  credits,
  plan,
  email,
  onSuccess,
}: {
  amount_inr: number
  credits?: number
  plan?: "pro_monthly"
  email: string
  onSuccess: (newBalance: number) => void
}) {
  const res = await fetch("/api/razorpay/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount_inr, credits, plan }),
  })
  if (!res.ok) {
    toast.error("Failed to create order. Please try again.")
    return
  }
  const { order_id, amount, currency, key_id } = await res.json()

  const options = {
    key: key_id,
    amount,
    currency,
    order_id,
    name: "RankersKit",
    description: credits ? `${credits} Credits` : plan === "pro_monthly" ? "Pro Plan" : "Purchase",
    prefill: { email },
    theme: { color: "#005bc1" },
    handler: async (response: {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    }) => {
      const verifyRes = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      })
      if (verifyRes.ok) {
        const data = await verifyRes.json()
        toast.success(plan === "pro_monthly" ? "Welcome to Pro! 🎉" : `${credits} credits added!`)
        onSuccess(data.new_balance ?? data.credits_added ?? 0)
      } else {
        toast.error("Payment verification failed. Contact support if charged.")
      }
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.open()
}

// ---------- Main component ----------

export default function CreditsPageClient({
  initialData,
  initialTransactions,
  topupPackages,
  proTierConfig,
}: {
  initialData: UserData
  initialTransactions: CreditTransaction[]
  topupPackages: TopupPackage[]
  proTierConfig: ProTierConfig
}) {
  const searchParams = useSearchParams()
  const rawTab = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<"buy" | "history">(
    rawTab === "history" ? "history" : "buy"
  )
  const [creditBalance, setCreditBalance] = useState(initialData.credit_balance)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [page, setPage] = useState(0)
  const [loadingMore, startLoadMore] = useTransition()
  const supabase = createClient()

  const handleLoadMore = useCallback(() => {
    startLoadMore(async () => {
      const nextPage = page + 1
      const from = nextPage * 20
      const to = from + 19
      const { data } = await supabase
        .from("credit_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to)
      if (data && data.length > 0) {
        setTransactions((prev) => [...prev, ...(data as unknown as CreditTransaction[])])
        setPage(nextPage)
      }
    })
  }, [page, supabase])

  const handlePurchaseSuccess = useCallback((newBalance: number) => {
    // Refresh balance from server
    supabase
      .from("user_profiles")
      .select("credit_balance")
      .single()
      .then(({ data }) => {
        if (data) {
          setCreditBalance((data as unknown as { credit_balance: number }).credit_balance)
        } else if (newBalance) {
          setCreditBalance((prev) => prev + newBalance)
        }
      })
    // Refresh transaction history
    supabase
      .from("credit_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setTransactions(data as unknown as CreditTransaction[])
      })
  }, [supabase])

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="grid gap-6">
        {/* Referral banner */}
        <Link
          href="/referral"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 hover:bg-emerald-500/10 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Gift className="size-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Earn free credits! Refer a friend
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">→</span>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credits</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Buy credits, track usage, and earn through referrals
          </p>
        </div>

        {/* Balance card */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Balance</p>
              <div className="mt-1 flex items-center gap-2">
                <Coins className="size-6 text-primary" />
                <span className="text-3xl font-bold tabular-nums">{creditBalance}</span>
                <span className="text-muted-foreground">credits</span>
              </div>
            </div>
            <div className="text-right">
              {initialData.plan === "pro" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-700">
                  <Sparkles className="size-3.5" />
                  Pro
                </span>
              ) : (
                <span className="rounded-full border px-3 py-1 text-sm text-muted-foreground">Free</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border bg-muted/30 p-1 gap-1">
          {(["buy", "history"] as const).map((tab) => {
            const icons = { buy: Zap, history: History }
            const labels = { buy: "Buy Credits", history: "Usage History" }
            const Icon = icons[tab]
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 min-h-[40px]",
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden sm:inline">{labels[tab]}</span>
                <span className="sm:hidden">{tab === "buy" ? "Buy" : "History"}</span>
              </button>
            )
          })}
        </div>

        {/* Tab: Buy Credits */}
        {activeTab === "buy" && (
          <BuyTab
            plan={initialData.plan}
            email={initialData.email}
            onSuccess={handlePurchaseSuccess}
            topupPackages={topupPackages}
            proTierConfig={proTierConfig}
          />
        )}

        {/* Tab: Usage History */}
        {activeTab === "history" && (
          <HistoryTab
            transactions={transactions}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
          />
        )}
      </div>
    </>
  )
}

// ---------- Buy Tab ----------

function BuyTab({
  plan,
  email,
  onSuccess,
  topupPackages,
  proTierConfig,
}: {
  plan: string
  email: string
  onSuccess: (newBalance: number) => void
  topupPackages: TopupPackage[]
  proTierConfig: ProTierConfig
}) {
  const packages = topupPackages.map((pkg, i) => ({
    credits: pkg.credits,
    price: pkg.price_inr,
    popular: pkg.popular ?? i === 1,
  }))

  return (
    <div className="grid gap-5">
      {/* Pro upgrade card */}
      {plan !== "pro" && (
        <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-4 text-amber-600" />
                <span className="font-semibold text-amber-900 dark:text-amber-400">Go Pro</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-700">BEST VALUE</span>
              </div>
              <p className="text-2xl font-bold">₹{proTierConfig.price_inr}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <ul className="mt-3 grid gap-1.5">
                {[
                  `${proTierConfig.monthly_credits.toLocaleString()} credits every month`,
                  "Priority support",
                  "Early access to new features",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-amber-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              openRazorpayCheckout({
                amount_inr: proTierConfig.price_inr,
                plan: "pro_monthly",
                email,
                onSuccess,
              })
            }
            className="mt-4 w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors min-h-[48px]"
          >
            Subscribe — ₹{proTierConfig.price_inr}/month
          </button>
        </div>
      )}

      {/* Pro active banner */}
      {plan === "pro" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <Sparkles className="size-5 text-amber-600 shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            You&apos;re on Pro — your credits refresh every month!
          </p>
        </div>
      )}

      {/* Top-up packages */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          One-time top-ups
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {packages.map((pkg) => (
            <button
              key={pkg.credits}
              type="button"
              onClick={() =>
                openRazorpayCheckout({
                  amount_inr: pkg.price,
                  credits: pkg.credits,
                  email,
                  onSuccess,
                })
              }
              className={cn(
                "relative flex flex-col items-center rounded-xl border p-4 text-center transition-all hover:border-primary/40 hover:bg-primary/5 min-h-[100px] justify-center gap-1",
                pkg.popular && "border-primary/50 bg-primary/5"
              )}
            >
              {pkg.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white whitespace-nowrap">
                  POPULAR
                </span>
              )}
              <Coins className={cn("size-5", pkg.popular ? "text-primary" : "text-muted-foreground")} />
              <span className="text-lg font-bold tabular-nums">{pkg.credits}</span>
              <span className="text-xs text-muted-foreground">credits</span>
              <span className="mt-1 text-sm font-semibold text-primary">₹{pkg.price}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- History Tab ----------

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; colorClass: string }> = {
  question_attempt: {
    label: "Question attempt",
    icon: <TrendingUp className="size-4" />,
    colorClass: "text-red-600",
  },
  purchase: {
    label: "Credits purchased",
    icon: <Coins className="size-4" />,
    colorClass: "text-emerald-600",
  },
  pro_signup: {
    label: "Pro plan activated",
    icon: <Sparkles className="size-4" />,
    colorClass: "text-amber-600",
  },
  referral_bonus: {
    label: "Referral bonus",
    icon: <Gift className="size-4" />,
    colorClass: "text-emerald-600",
  },
  monthly_refresh: {
    label: "Monthly refresh",
    icon: <CheckCircle2 className="size-4" />,
    colorClass: "text-blue-600",
  },
  signup_bonus: {
    label: "Signup bonus",
    icon: <Zap className="size-4" />,
    colorClass: "text-emerald-600",
  },
}

function HistoryTab({
  transactions,
  onLoadMore,
  loadingMore,
}: {
  transactions: CreditTransaction[]
  onLoadMore: () => void
  loadingMore: boolean
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-12 text-center">
        <History className="mx-auto size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {transactions.map((txn) => {
        const meta = TYPE_META[txn.type] ?? {
          label: txn.type,
          icon: <Coins className="size-4" />,
          colorClass: "text-muted-foreground",
        }
        const isDebit = txn.amount < 0
        return (
          <div
            key={txn.id}
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 min-h-[56px]"
          >
            <div className={cn("shrink-0", meta.colorClass)}>{meta.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{meta.label}</p>
              {txn.description && (
                <p className="text-xs text-muted-foreground truncate">{txn.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {format(new Date(txn.created_at), "d MMM yyyy, HH:mm")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn("text-sm font-semibold tabular-nums", isDebit ? "text-red-600" : "text-emerald-600")}>
                {isDebit ? "" : "+"}{txn.amount}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">{txn.balance_after} left</p>
            </div>
          </div>
        )
      })}
      {transactions.length % 20 === 0 && transactions.length > 0 && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full rounded-xl border py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors min-h-[48px]"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  )
}


