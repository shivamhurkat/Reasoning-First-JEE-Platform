import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getReferralConfig } from "@/lib/queries/config"
import ReferralPageClient from "./referral-client"

export const dynamic = "force-dynamic"

export default async function ReferralPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [profileRes, referralRowsRes, referralConfig] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("credit_balance, plan, referral_code, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("referrals")
      .select("referred_id, credits_awarded, created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
    getReferralConfig(),
  ])

  const profile = profileRes.data as unknown as {
    credit_balance: number
    plan: string
    referral_code: string
    email: string
  } | null

  // Get referred user names
  const referralRows = (referralRowsRes.data ?? []) as unknown as {
    referred_id: string
    credits_awarded: number
    created_at: string
  }[]

  type ReferralDetail = {
    referred_id: string
    credits_awarded: number
    created_at: string
    referred_name: string
  }

  let referrals: ReferralDetail[] = []

  if (referralRows.length > 0) {
    const referredIds = referralRows.map((r) => r.referred_id)
    const { data: referredProfiles } = await supabase
      .from("user_profiles")
      .select("id, full_name")
      .in("id", referredIds)

    const nameMap: Record<string, string | null> = {}
    for (const p of referredProfiles ?? []) {
      nameMap[p.id] = (p as unknown as { full_name?: string | null }).full_name ?? null
    }

    referrals = referralRows.map((r) => ({
      ...r,
      referred_name: nameMap[r.referred_id] ?? "A student",
    }))
  }

  const stats = {
    count: referralRows.length,
    credits_earned: referralRows.reduce((s, r) => s + (r.credits_awarded ?? 0), 0),
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("supabase.co", "vercel.app") ||
    "https://rankerskit.com"

  return (
    <ReferralPageClient
      referralCode={profile?.referral_code ?? ""}
      email={profile?.email ?? user.email ?? ""}
      stats={stats}
      referrals={referrals}
      appUrl={appUrl}
      referralConfig={referralConfig}
    />
  )
}
