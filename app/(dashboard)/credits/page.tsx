import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getTopupPackages, getProTierConfig } from "@/lib/queries/config"
import CreditsPageClient from "./credits-client"

export const dynamic = "force-dynamic"

export default async function CreditsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [profileRes, txnRes, topupPackages, proTierConfig] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("credit_balance, plan, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("credit_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    getTopupPackages(),
    getProTierConfig(),
  ])

  const profile = profileRes.data as unknown as {
    credit_balance: number
    plan: string
    email: string
  } | null

  return (
    <CreditsPageClient
      initialData={{
        credit_balance: profile?.credit_balance ?? 0,
        plan: profile?.plan ?? "free",
        email: profile?.email ?? user.email ?? "",
      }}
      initialTransactions={(txnRes.data ?? []) as unknown as Parameters<typeof CreditsPageClient>[0]["initialTransactions"]}
      topupPackages={topupPackages}
      proTierConfig={proTierConfig}
    />
  )
}
