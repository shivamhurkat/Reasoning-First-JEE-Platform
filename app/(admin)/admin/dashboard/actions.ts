"use server"

import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database, Json } from "@/lib/types/database.types"

// ---------- Auth guard for admin actions ----------

async function adminClient() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return { ok: false as const, error: "Not authorized" }
  }

  const service = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return { ok: true as const, service, supabase }
}

// ---------- getAdminMetrics ----------

export type AdminMetrics = {
  totalUsers: number
  usersThisMonth: number
  activeUsersLast7Days: number
  totalRevenue: number
  revenueThisMonth: number
  totalQuestionsAttempted: number
  questionsAttemptedToday: number
  proSubscribers: number
  // Credit economy
  totalCreditsInCirculation: number
  creditsPurchasedToday: number
  creditsSpentToday: number
  referralCreditsTotal: number
}

export async function getAdminMetrics(): Promise<
  { ok: true; metrics: AdminMetrics } | { ok: false; error: string }
> {
  const auth = await adminClient()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { service } = auth

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    totalUsersRes,
    usersThisMonthRes,
    activeUsersRes,
    proSubscribersRes,
    totalAttemptsRes,
    attemptsTodayRes,
    revenueAllRes,
    revenueMonthRes,
    creditsCirculationRes,
    creditsPurchasedTodayRes,
    creditsSpentTodayRes,
    referralCreditsTotalRes,
  ] = await Promise.all([
    service.from("user_profiles").select("*", { count: "exact", head: true }),
    service
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth),
    service
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .gte("last_active_date", sevenDaysAgo.slice(0, 10)),
    service
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .eq("plan", "pro")
      .gt("plan_expires_at", now.toISOString()),
    service.from("practice_attempts").select("*", { count: "exact", head: true }),
    service
      .from("practice_attempts")
      .select("*", { count: "exact", head: true })
      .gte("attempted_at", todayStart),
    service
      .from("payment_transactions")
      .select("amount_inr")
      .eq("status", "captured"),
    service
      .from("payment_transactions")
      .select("amount_inr")
      .eq("status", "captured")
      .gte("created_at", startOfMonth),
    service.from("user_profiles").select("credit_balance"),
    service
      .from("credit_transactions")
      .select("amount")
      .eq("type", "purchase")
      .gte("created_at", todayStart),
    service
      .from("credit_transactions")
      .select("amount")
      .eq("type", "question_attempt")
      .gte("created_at", todayStart),
    service
      .from("credit_transactions")
      .select("amount")
      .eq("type", "referral_bonus"),
  ])

  const sumAmount = (rows: { amount_inr: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + (r.amount_inr ?? 0), 0)

  const sumCredits = (rows: { amount: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + Math.abs(r.amount ?? 0), 0)

  const totalCreditsInCirculation = (
    creditsCirculationRes.data ?? []
  ).reduce(
    (s, r) =>
      s + ((r as unknown as { credit_balance?: number }).credit_balance ?? 0),
    0
  )

  return {
    ok: true,
    metrics: {
      totalUsers: totalUsersRes.count ?? 0,
      usersThisMonth: usersThisMonthRes.count ?? 0,
      activeUsersLast7Days: activeUsersRes.count ?? 0,
      proSubscribers: proSubscribersRes.count ?? 0,
      totalQuestionsAttempted: totalAttemptsRes.count ?? 0,
      questionsAttemptedToday: attemptsTodayRes.count ?? 0,
      totalRevenue: sumAmount(revenueAllRes.data as { amount_inr: number }[] | null),
      revenueThisMonth: sumAmount(revenueMonthRes.data as { amount_inr: number }[] | null),
      totalCreditsInCirculation,
      creditsPurchasedToday: sumCredits(creditsPurchasedTodayRes.data as { amount: number }[] | null),
      creditsSpentToday: sumCredits(creditsSpentTodayRes.data as { amount: number }[] | null),
      referralCreditsTotal: sumCredits(referralCreditsTotalRes.data as { amount: number }[] | null),
    },
  }
}

// ---------- getRecentTransactions ----------

export type AdminTransaction = {
  id: string
  created_at: string
  user_email: string
  type: string
  amount: number
  description: string | null
  razorpay_payment_id: string | null
}

export async function getRecentTransactions(
  limit = 20
): Promise<{ ok: true; transactions: AdminTransaction[] } | { ok: false; error: string }> {
  const auth = await adminClient()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { service } = auth

  const { data, error } = await service
    .from("credit_transactions")
    .select("id, created_at, user_id, type, amount, description, payment_transaction_id")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return { ok: false, error: error.message }

  // Fetch emails for all unique user_ids
  const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)))
  const { data: profiles } = await service
    .from("user_profiles")
    .select("id, email")
    .in("id", userIds)

  const emailMap: Record<string, string> = {}
  for (const p of profiles ?? []) {
    emailMap[p.id] = p.email ?? "—"
  }

  // Fetch Razorpay payment IDs from payment_transactions
  const paymentTxnIds = (data ?? [])
    .map((r) => r.payment_transaction_id)
    .filter(Boolean) as string[]

  const { data: paymentTxns } = paymentTxnIds.length
    ? await service
        .from("payment_transactions")
        .select("id, razorpay_payment_id")
        .in("id", paymentTxnIds)
    : { data: [] }

  const paymentMap: Record<string, string | null> = {}
  for (const p of paymentTxns ?? []) {
    paymentMap[p.id] = p.razorpay_payment_id ?? null
  }

  const transactions: AdminTransaction[] = (data ?? []).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    user_email: emailMap[r.user_id] ?? "—",
    type: r.type,
    amount: r.amount,
    description: r.description,
    razorpay_payment_id: r.payment_transaction_id
      ? paymentMap[r.payment_transaction_id] ?? null
      : null,
  }))

  return { ok: true, transactions }
}

// ---------- updateAdminConfig ----------

export async function updateAdminConfig(
  key: string,
  value: Json
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await adminClient()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { service } = auth

  const { error } = await service
    .from("admin_config")
    .upsert({ key, value, updated_at: new Date().toISOString() })

  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/dashboard")
  revalidatePath("/credits")
  revalidatePath("/referral")
  return { ok: true }
}
