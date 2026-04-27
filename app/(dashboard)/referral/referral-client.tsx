"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import {
  Gift,
  Copy,
  Share2,
  Users,
  Coins,
  ChevronRight,
  CheckCircle2,
  Link as LinkIcon,
  Pause,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ReferralConfig } from "@/lib/queries/config"

type ReferralDetail = {
  referred_id: string
  credits_awarded: number
  created_at: string
  referred_name: string
}

type Props = {
  referralCode: string
  email: string
  stats: { count: number; credits_earned: number }
  referrals: ReferralDetail[]
  appUrl: string
  referralConfig: ReferralConfig
}

export default function ReferralPageClient({
  referralCode,
  stats,
  referrals,
  appUrl,
  referralConfig,
}: Props) {
  const bonusCredits = referralConfig.bonus_credits
  const referralLink = `${appUrl}/signup?ref=${referralCode}`

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralCode)
      toast.success("Referral code copied!")
    } catch {
      toast.error("Could not copy")
    }
  }, [referralCode])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      toast.success("Referral link copied!")
    } catch {
      toast.error("Could not copy link")
    }
  }, [referralLink])

  const handleWhatsApp = useCallback(() => {
    const msg = encodeURIComponent(
      `Hey! Use my referral code to get ${bonusCredits} free credits on ReasonLab for JEE practice 🎯\n\nSign up here: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${msg}`, "_blank")
  }, [referralLink, bonusCredits])

  // Program paused state
  if (!referralConfig.enabled) {
    return (
      <div className="grid gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gift className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Refer &amp; Earn</h1>
          </div>
          <p className="text-sm text-muted-foreground">Earn free credits by inviting friends</p>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-10 text-center">
          <Pause className="mx-auto size-10 text-muted-foreground/40 mb-3" />
          <h2 className="font-semibold text-lg mb-1">Referral program paused</h2>
          <p className="text-sm text-muted-foreground">
            The referral program is temporarily paused. Check back soon!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Gift className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Refer &amp; Earn</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Invite friends to ReasonLab and both of you get {bonusCredits} free credits
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
          How it works
        </h2>
        <div className="grid gap-0">
          {[
            {
              icon: Share2,
              title: "Share your link",
              desc: "Send your unique referral link to a friend",
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: Users,
              title: "Friend signs up",
              desc: "They create an account using your link or code",
              color: "text-emerald-600",
              bg: "bg-emerald-500/10",
            },
            {
              icon: Coins,
              title: `You both get ${bonusCredits} credits`,
              desc: `Free credits added to both accounts instantly!`,
              color: "text-amber-600",
              bg: "bg-amber-500/10",
            },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    step.bg
                  )}
                >
                  <step.icon className={cn("size-5", step.color)} />
                </div>
                {i < 2 && (
                  <div className="w-px h-5 bg-border my-1" />
                )}
              </div>
              <div className="pb-5">
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4 text-center">
          <Users className="mx-auto size-5 text-muted-foreground mb-1" />
          <p className="text-3xl font-bold tabular-nums mt-1">{stats.count}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Friends referred</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 text-center">
          <Coins className="mx-auto size-5 text-amber-500 mb-1" />
          <p className="text-3xl font-bold tabular-nums mt-1 text-amber-600">
            +{stats.credits_earned}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Credits earned</p>
        </div>
      </div>

      {/* Referral code */}
      <div className="rounded-2xl border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Your referral code
        </p>
        <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3">
          <span className="flex-1 font-mono text-2xl font-bold tracking-widest text-primary">
            {referralCode || "—"}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors min-h-[36px]"
          >
            <Copy className="size-3.5" />
            Copy
          </button>
        </div>
      </div>

      {/* Shareable link */}
      <div className="rounded-2xl border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Shareable link
        </p>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 mb-3">
          <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-xs text-muted-foreground truncate font-mono">
            {referralLink}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium hover:bg-muted/50 transition-colors min-h-[48px]"
          >
            <Copy className="size-4" />
            Copy Link
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors min-h-[48px]"
          >
            <Share2 className="size-4" />
            WhatsApp
          </button>
        </div>
      </div>

      {/* Referral list */}
      {referrals.length > 0 && (
        <div className="grid gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your referrals
          </h2>
          {referrals.map((r) => (
            <div
              key={r.referred_id}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 min-h-[56px]"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{r.referred_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(r.created_at), "d MMM yyyy")}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-sm font-semibold text-emerald-600">
                  +{r.credits_awarded}
                </span>
                <p className="text-xs text-muted-foreground">credits</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {referrals.length === 0 && (
        <div className="rounded-xl border border-dashed py-10 text-center">
          <Gift className="mx-auto size-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">No referrals yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Share your link above to get started
          </p>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Share2 className="size-4" />
            Share on WhatsApp
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
