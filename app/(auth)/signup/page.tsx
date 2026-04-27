import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getReferralConfig } from "@/lib/queries/config"
import SignupForm from "./signup-form"

export default async function SignupPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  const referralConfig = await getReferralConfig()

  return <SignupForm referralEnabled={referralConfig.enabled} bonusCredits={referralConfig.bonus_credits} />
}
