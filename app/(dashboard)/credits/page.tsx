import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CreditsPageClient from "./credits-client"

export const dynamic = "force-dynamic"

export default async function CreditsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [profileRes, txnRes, referralRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("credit_balance, plan, referral_code, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("credit_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("referrals")
      .select("credits_awarded")
      .eq("referrer_id", user.id),
  ])

  const profile = profileRes.data as unknown as {
    credit_balance: number
    plan: string
    referral_code: string
    email: string
  } | null

  const referralRows = (referralRes.data ?? []) as unknown as { credits_awarded: number }[]
  const referralStats = {
    count: referralRows.length,
    credits_earned: referralRows.reduce((sum, r) => sum + (r.credits_awarded ?? 0), 0),
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("supabase.co", "vercel.app") ||
    "https://rankerskit.com"

  return (
    <CreditsPageClient
      initialData={{
        credit_balance: profile?.credit_balance ?? 0,
        plan: profile?.plan ?? "free",
        referral_code: profile?.referral_code ?? "",
        email: profile?.email ?? user.email ?? "",
      }}
      initialTransactions={(txnRes.data ?? []) as unknown as Parameters<typeof CreditsPageClient>[0]["initialTransactions"]}
      initialReferralStats={referralStats}
      appUrl={appUrl}
    />
  )
}
