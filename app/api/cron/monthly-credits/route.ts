import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database.types"

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const serviceSupabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Find users needing refresh: credits_last_refreshed_at < 30 days ago (or null)
  const { data: users, error } = await serviceSupabase
    .from("user_profiles")
    .select("id, credit_balance, plan, plan_expires_at, credits_last_refreshed_at")
    .or(`credits_last_refreshed_at.is.null,credits_last_refreshed_at.lt.${thirtyDaysAgo}`) as {
      data: Array<{
        id: string
        credit_balance: number
        plan: string
        plan_expires_at: string | null
        credits_last_refreshed_at: string | null
      }> | null
      error: unknown
    }

  if (error || !users) {
    console.error("Cron: failed to fetch users", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }

  let refreshed = 0
  const nowIso = now.toISOString()

  for (const user of users) {
    const isPro = user.plan === "pro"
    const proStillActive = isPro && user.plan_expires_at && new Date(user.plan_expires_at) > now

    let creditsToAdd = 0
    let newPlan = user.plan

    if (proStillActive) {
      // Active pro user → 1000 credits
      creditsToAdd = 1000
    } else if (isPro && !proStillActive) {
      // Pro expired → downgrade to free, give 10 credits
      creditsToAdd = 10
      newPlan = "free"
    } else {
      // Free user → 10 credits
      creditsToAdd = 10
    }

    const newBalance = (user.credit_balance ?? 0) + creditsToAdd

    const updatePayload: Record<string, unknown> = {
      credit_balance: newBalance,
      credits_last_refreshed_at: nowIso,
    }
    if (newPlan !== user.plan) {
      updatePayload.plan = newPlan
    }

    await serviceSupabase
      .from("user_profiles")
      .update(updatePayload as never)
      .eq("id", user.id)

    await serviceSupabase.from("credit_transactions").insert({
      user_id: user.id,
      type: "monthly_refresh",
      amount: creditsToAdd,
      balance_after: newBalance,
      description: proStillActive
        ? "Monthly credit refresh — Pro plan"
        : newPlan === "free" && isPro
          ? "Monthly credit refresh — Pro plan expired, downgraded to Free"
          : "Monthly credit refresh — Free plan",
    } as never)

    refreshed++
  }

  return NextResponse.json({ ok: true, users_refreshed: refreshed })
}
