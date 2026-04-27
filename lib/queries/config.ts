import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/types/database.types"

// ---------- Types ----------

export type TopupPackage = {
  credits: number
  price_inr: number
  popular?: boolean
}

export type ReferralConfig = {
  bonus_credits: number
  referrer_bonus?: number
  referred_bonus?: number
  enabled: boolean
}

export type CreditCosts = {
  question_attempt: number
  hint: number
}

export type FreeTierConfig = {
  monthly_credits: number
  signup_bonus_credits: number
}

export type ProTierConfig = {
  monthly_credits: number
  price_inr: number
}

// ---------- Low-level getter ----------

async function getConfigRaw(key: string): Promise<Json | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("admin_config")
      .select("value")
      .eq("key", key)
      .maybeSingle()
    if (error || !data) return null
    return data.value
  } catch {
    return null
  }
}

// ---------- Typed getters ----------

export async function getCreditCosts(): Promise<CreditCosts> {
  const raw = await getConfigRaw("credit_costs")
  const defaults: CreditCosts = { question_attempt: 1, hint: 0 }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults
  const obj = raw as Record<string, Json>
  return {
    question_attempt:
      typeof obj.question_attempt === "number" ? obj.question_attempt : 1,
    hint: typeof obj.hint === "number" ? obj.hint : 0,
  }
}

export async function getTopupPackages(): Promise<TopupPackage[]> {
  const raw = await getConfigRaw("topup_packages")
  const defaults: TopupPackage[] = [
    { credits: 50, price_inr: 29 },
    { credits: 100, price_inr: 49, popular: true },
    { credits: 250, price_inr: 99 },
    { credits: 500, price_inr: 179 },
  ]
  if (!Array.isArray(raw)) return defaults
  return raw.map((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return defaults[i] ?? defaults[0]
    const obj = item as Record<string, Json>
    return {
      credits: typeof obj.credits === "number" ? obj.credits : 100,
      price_inr: typeof obj.price_inr === "number" ? obj.price_inr : 49,
      popular: i === 1,
    }
  })
}

export async function getReferralConfig(): Promise<ReferralConfig> {
  const raw = await getConfigRaw("referral")
  const defaults: ReferralConfig = { bonus_credits: 50, enabled: true }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults
  const obj = raw as Record<string, Json>
  return {
    bonus_credits:
      typeof obj.bonus_credits === "number" ? obj.bonus_credits : 50,
    referrer_bonus:
      typeof obj.referrer_bonus === "number" ? obj.referrer_bonus : (typeof obj.bonus_credits === "number" ? obj.bonus_credits : 50),
    referred_bonus:
      typeof obj.referred_bonus === "number" ? obj.referred_bonus : (typeof obj.bonus_credits === "number" ? obj.bonus_credits : 50),
    enabled: obj.enabled !== false, // default to true
  }
}

export async function getFreeTierConfig(): Promise<FreeTierConfig> {
  const raw = await getConfigRaw("free_tier")
  const defaults: FreeTierConfig = {
    monthly_credits: 10,
    signup_bonus_credits: 10,
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults
  const obj = raw as Record<string, Json>
  return {
    monthly_credits:
      typeof obj.monthly_credits === "number" ? obj.monthly_credits : 10,
    signup_bonus_credits:
      typeof obj.signup_bonus_credits === "number"
        ? obj.signup_bonus_credits
        : 10,
  }
}

export async function getProTierConfig(): Promise<ProTierConfig> {
  const raw = await getConfigRaw("pro_tier")
  const defaults: ProTierConfig = { monthly_credits: 1000, price_inr: 99 }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults
  const obj = raw as Record<string, Json>
  return {
    monthly_credits:
      typeof obj.monthly_credits === "number" ? obj.monthly_credits : 1000,
    price_inr: typeof obj.price_inr === "number" ? obj.price_inr : 99,
  }
}
