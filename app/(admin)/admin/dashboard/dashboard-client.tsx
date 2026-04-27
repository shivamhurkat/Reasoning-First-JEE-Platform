"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Activity,
  BarChart2,
  Coins,
  CreditCard,
  Gift,
  LayoutDashboard,
  RefreshCw,
  Save,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { AdminMetrics, AdminTransaction } from "./actions"
import { updateAdminConfig } from "./actions"
import type { TopupPackage, CreditCosts, FreeTierConfig, ProTierConfig, ReferralConfig } from "@/lib/queries/config"

// ---------- Types ----------

type Props = {
  metrics: AdminMetrics
  transactions: AdminTransaction[]
  configs: {
    creditCosts: CreditCosts
    freeTier: FreeTierConfig
    proTier: ProTierConfig
    topupPackages: TopupPackage[]
    referral: ReferralConfig
  }
}

// ---------- Stat Card ----------

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  color = "primary",
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { label: string; value: string | number }
  color?: "primary" | "emerald" | "amber" | "blue" | "violet" | "muted"
}) {
  const colorMap = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-600 bg-emerald-500/10",
    amber: "text-amber-600 bg-amber-500/10",
    blue: "text-blue-600 bg-blue-500/10",
    violet: "text-violet-600 bg-violet-500/10",
    muted: "text-muted-foreground bg-muted/50",
  }

  return (
    <div className="rounded-2xl border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl p-2.5", colorMap[color])}>
          <Icon className="size-5" />
        </div>
        {trend && (
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            {trend.label}: <span className="font-medium">{trend.value}</span>
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ---------- Transaction type badge ----------

const TXN_TYPE_META: Record<string, { label: string; color: string }> = {
  question_attempt: { label: "Attempt", color: "text-red-600 bg-red-500/10" },
  purchase: { label: "Purchase", color: "text-emerald-600 bg-emerald-500/10" },
  pro_signup: { label: "Pro", color: "text-amber-600 bg-amber-500/10" },
  referral_bonus: { label: "Referral", color: "text-violet-600 bg-violet-500/10" },
  monthly_refresh: { label: "Refresh", color: "text-blue-600 bg-blue-500/10" },
  signup_bonus: { label: "Signup", color: "text-emerald-600 bg-emerald-500/10" },
  manual_adjustment: { label: "Manual", color: "text-muted-foreground bg-muted" },
}

// ---------- Main client component ----------

export default function AdminDashboardClient({ metrics, transactions, configs }: Props) {
  // Credit costs state
  const [questionCost, setQuestionCost] = useState(configs.creditCosts.question_attempt)

  // Free tier state
  const [freeMonthlyCredits, setFreeMonthlyCredits] = useState(configs.freeTier.monthly_credits)
  const [freeSignupBonus, setFreeSignupBonus] = useState(configs.freeTier.signup_bonus_credits)

  // Pro tier state
  const [proMonthlyCredits, setProMonthlyCredits] = useState(configs.proTier.monthly_credits)
  const [proPrice, setProPrice] = useState(configs.proTier.price_inr)

  // Topup packages state
  const [packages, setPackages] = useState<TopupPackage[]>(configs.topupPackages)

  // Referral state
  const [referrerBonus, setReferrerBonus] = useState(configs.referral.bonus_credits)
  const [referredBonus, setReferredBonus] = useState(configs.referral.bonus_credits)
  const [referralEnabled, setReferralEnabled] = useState(configs.referral.enabled)

  const [, startTransition] = useTransition()

  const handleSave = (key: string, value: unknown, label: string) => {
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await updateAdminConfig(key, value as any)
      if (result.ok) {
        toast.success(`${label} saved`)
      } else {
        toast.error(`Failed: ${result.error}`)
      }
    })
  }

  return (
    <div className="grid gap-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-amber-500/10 p-2.5">
          <LayoutDashboard className="size-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time platform metrics &amp; controls</p>
        </div>
      </div>

      {/* ── Section 1: Key Metrics ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          User metrics
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total users"
            value={metrics.totalUsers.toLocaleString()}
            icon={Users}
            color="primary"
            trend={{ label: "This month", value: `+${metrics.usersThisMonth}` }}
          />
          <StatCard
            label="Active (7 days)"
            value={metrics.activeUsersLast7Days.toLocaleString()}
            icon={Activity}
            color="emerald"
          />
          <StatCard
            label="Pro subscribers"
            value={metrics.proSubscribers.toLocaleString()}
            icon={Shield}
            color="amber"
          />
          <StatCard
            label="Total revenue"
            value={`₹${metrics.totalRevenue.toLocaleString()}`}
            icon={TrendingUp}
            color="emerald"
            trend={{ label: "This month", value: `₹${metrics.revenueThisMonth}` }}
          />
        </div>

        <h2 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Practice metrics
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Questions attempted (total)"
            value={metrics.totalQuestionsAttempted.toLocaleString()}
            icon={BarChart2}
            color="blue"
          />
          <StatCard
            label="Questions attempted (today)"
            value={metrics.questionsAttemptedToday.toLocaleString()}
            icon={Zap}
            color="violet"
          />
          <StatCard
            label="Users this month"
            value={metrics.usersThisMonth.toLocaleString()}
            icon={Users}
            color="muted"
          />
          <StatCard
            label="Revenue this month"
            value={`₹${metrics.revenueThisMonth.toLocaleString()}`}
            icon={CreditCard}
            color="emerald"
          />
        </div>
      </section>

      {/* ── Section 2: Credit Economy ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Credit economy
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Credits in circulation"
            value={metrics.totalCreditsInCirculation.toLocaleString()}
            icon={Coins}
            color="amber"
          />
          <StatCard
            label="Purchased today"
            value={`+${metrics.creditsPurchasedToday}`}
            icon={CreditCard}
            color="emerald"
          />
          <StatCard
            label="Spent today"
            value={`-${metrics.creditsSpentToday}`}
            icon={Activity}
            color="primary"
          />
          <StatCard
            label="Referral credits (total)"
            value={`+${metrics.referralCreditsTotal}`}
            icon={Gift}
            color="violet"
          />
        </div>
      </section>

      {/* ── Section 3: Recent Transactions ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Clock className="size-3.5" />
          Recent transactions
        </h2>
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                    Payment ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((txn) => {
                  const meta = TXN_TYPE_META[txn.type] ?? {
                    label: txn.type,
                    color: "text-muted-foreground bg-muted",
                  }
                  return (
                    <tr key={txn.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(txn.created_at), "d MMM, HH:mm")}
                      </td>
                      <td className="px-4 py-3 text-xs truncate max-w-[140px]">
                        {txn.user_email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", meta.color)}>
                          {meta.label}
                        </span>
                      </td>
                      <td className={cn("px-4 py-3 text-right tabular-nums font-semibold text-sm", txn.amount < 0 ? "text-red-600" : "text-emerald-600")}>
                        {txn.amount > 0 ? "+" : ""}{txn.amount}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[180px] hidden md:table-cell">
                        {txn.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground hidden lg:table-cell">
                        {txn.razorpay_payment_id ?? "—"}
                      </td>
                    </tr>
                  )
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 4: Controls ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Settings className="size-3.5" />
          Real-time controls
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          {/* 4a. Credit Costs */}
          <ConfigCard title="Credit costs" icon={Zap}>
            <NumberField
              label="Credits per question attempt"
              value={questionCost}
              onChange={setQuestionCost}
              min={0}
              max={100}
            />
            <SaveButton
              onClick={() =>
                handleSave("credit_costs", { question_attempt: questionCost, hint: 0 }, "Credit costs")
              }
            />
          </ConfigCard>

          {/* 4b. Free Tier */}
          <ConfigCard title="Free tier" icon={Users}>
            <NumberField
              label="Monthly free credits"
              value={freeMonthlyCredits}
              onChange={setFreeMonthlyCredits}
              min={0}
            />
            <NumberField
              label="Signup bonus credits"
              value={freeSignupBonus}
              onChange={setFreeSignupBonus}
              min={0}
            />
            <SaveButton
              onClick={() =>
                handleSave(
                  "free_tier",
                  { monthly_credits: freeMonthlyCredits, signup_bonus_credits: freeSignupBonus },
                  "Free tier"
                )
              }
            />
          </ConfigCard>

          {/* 4c. Pro Tier */}
          <ConfigCard title="Pro tier" icon={Shield}>
            <NumberField
              label="Monthly pro credits"
              value={proMonthlyCredits}
              onChange={setProMonthlyCredits}
              min={0}
            />
            <NumberField
              label="Pro price (₹/month)"
              value={proPrice}
              onChange={setProPrice}
              min={0}
              prefix="₹"
            />
            <SaveButton
              onClick={() =>
                handleSave(
                  "pro_tier",
                  { monthly_credits: proMonthlyCredits, price_inr: proPrice },
                  "Pro tier"
                )
              }
            />
          </ConfigCard>

          {/* 4d. Topup Packages */}
          <ConfigCard title="Top-up packages" icon={CreditCard}>
            <div className="grid gap-2">
              {packages.map((pkg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="number"
                    value={pkg.credits}
                    min={1}
                    onChange={(e) => {
                      const next = [...packages]
                      next[i] = { ...next[i], credits: Number(e.target.value) }
                      setPackages(next)
                    }}
                    className="w-20 rounded-md border bg-background px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Credits"
                  />
                  <span className="text-xs text-muted-foreground">credits for</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <input
                      type="number"
                      value={pkg.price_inr}
                      min={1}
                      onChange={(e) => {
                        const next = [...packages]
                        next[i] = { ...next[i], price_inr: Number(e.target.value) }
                        setPackages(next)
                      }}
                      className="w-20 rounded-md border bg-background pl-5 pr-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Price"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPackages(packages.filter((_, j) => j !== i))}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setPackages([...packages, { credits: 100, price_inr: 49 }])
              }
              className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="size-3.5" />
              Add package
            </button>
            <SaveButton
              onClick={() =>
                handleSave(
                  "topup_packages",
                  packages.map((p) => ({ credits: p.credits, price_inr: p.price_inr })),
                  "Topup packages"
                )
              }
            />
          </ConfigCard>

          {/* 4e. Referral Settings */}
          <ConfigCard title="Referral program" icon={Gift}>
            <NumberField
              label="Referrer bonus credits"
              value={referrerBonus}
              onChange={setReferrerBonus}
              min={0}
            />
            <NumberField
              label="Referred user bonus credits"
              value={referredBonus}
              onChange={setReferredBonus}
              min={0}
            />
            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5 mt-2">
              <div>
                <p className="text-sm font-medium">Referral program enabled</p>
                <p className="text-xs text-muted-foreground">
                  When off, referral fields are hidden and no bonuses are awarded
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReferralEnabled((v) => !v)}
                className={cn(
                  "transition-colors",
                  referralEnabled ? "text-emerald-600" : "text-muted-foreground"
                )}
              >
                {referralEnabled ? (
                  <ToggleRight className="size-8" />
                ) : (
                  <ToggleLeft className="size-8" />
                )}
              </button>
            </div>
            <SaveButton
              onClick={() =>
                handleSave(
                  "referral",
                  { bonus_credits: referrerBonus, referrer_bonus: referrerBonus, referred_bonus: referredBonus, enabled: referralEnabled },
                  "Referral settings"
                )
              }
            />
          </ConfigCard>
        </div>
      </section>
    </div>
  )
}

// ---------- Helper components ----------

function ConfigCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  prefix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  prefix?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-muted-foreground flex-1">{label}</label>
      <div className="relative shrink-0">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "w-24 rounded-md border bg-background py-1.5 text-sm tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-primary",
            prefix ? "pl-6 pr-2" : "px-2"
          )}
        />
      </div>
    </div>
  )
}

function SaveButton({ onClick }: { onClick: () => void }) {
  const [, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const handleClick = () => {
    startTransition(() => {
      onClick()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
        saved
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      )}
    >
      {saved ? (
        <>
          <RefreshCw className="size-3.5 animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Save className="size-3.5" />
          Save changes
        </>
      )}
    </button>
  )
}
