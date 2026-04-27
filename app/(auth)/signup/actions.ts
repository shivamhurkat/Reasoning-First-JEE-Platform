"use server"

import { createClient as createServiceClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database.types"

export async function processReferral(referralCode: string, newUserId: string): Promise<void> {
  if (!referralCode || !newUserId) return

  const serviceSupabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Look up the referrer by referral_code
  const { data: referrer } = await serviceSupabase
    .from("user_profiles")
    .select("id, credit_balance")
    .eq("referral_code", referralCode)
    .maybeSingle()

  if (!referrer) return
  // Don't allow self-referral
  if (referrer.id === newUserId) return

  // Check if this referral was already processed
  const { data: existingReferral } = await serviceSupabase
    .from("referrals")
    .select("id")
    .eq("referred_id", newUserId)
    .maybeSingle()

  if (existingReferral) return // Already processed

  // Insert into referrals table
  await serviceSupabase.from("referrals").insert({
    referrer_id: referrer.id,
    referred_id: newUserId,
    credits_awarded: 50,
  } as never)

  // Update referred_by on new user
  await serviceSupabase
    .from("user_profiles")
    .update({ referred_by: referrer.id } as never)
    .eq("id", newUserId)

  // Add 50 credits to referrer
  const referrerBalance = (referrer as unknown as { credit_balance?: number }).credit_balance ?? 0
  const referrerNewBalance = referrerBalance + 50

  await serviceSupabase
    .from("user_profiles")
    .update({ credit_balance: referrerNewBalance } as never)
    .eq("id", referrer.id)

  await serviceSupabase.from("credit_transactions").insert({
    user_id: referrer.id,
    type: "referral_bonus",
    amount: 50,
    balance_after: referrerNewBalance,
    description: `Referral bonus — friend signed up`,
  } as never)

  // Add 50 credits to new user (on top of signup bonus)
  const { data: newUserProfile } = await serviceSupabase
    .from("user_profiles")
    .select("credit_balance")
    .eq("id", newUserId)
    .maybeSingle()

  const newUserBalance = (newUserProfile as unknown as { credit_balance?: number } | null)?.credit_balance ?? 10
  const newUserNewBalance = newUserBalance + 50

  await serviceSupabase
    .from("user_profiles")
    .update({ credit_balance: newUserNewBalance } as never)
    .eq("id", newUserId)

  await serviceSupabase.from("credit_transactions").insert({
    user_id: newUserId,
    type: "referral_bonus",
    amount: 50,
    balance_after: newUserNewBalance,
    description: `Referral bonus — signed up with referral code`,
  } as never)
}
