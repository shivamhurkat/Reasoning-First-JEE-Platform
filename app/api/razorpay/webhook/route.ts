import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database.types"

// Razorpay expects 200 on all responses — retry on non-200.
// Signature header: X-Razorpay-Signature

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  const sig = req.headers.get("x-razorpay-signature") ?? ""

  const rawBody = await req.text()

  // Verify webhook signature if secret is configured
  if (secret) {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
    if (expected !== sig) {
      // Return 200 anyway so Razorpay doesn't retry — just log and bail
      console.warn("Razorpay webhook: invalid signature")
      return NextResponse.json({ ok: false }, { status: 200 })
    }
  }

  let event: { event: string; payload?: { payment?: { entity?: Record<string, unknown> } } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  const serviceSupabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const paymentEntity = event.payload?.payment?.entity
  const orderId = paymentEntity?.order_id as string | undefined
  const paymentId = paymentEntity?.id as string | undefined

  if (!orderId) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  // Find the transaction
  const { data: txn } = await serviceSupabase
    .from("payment_transactions")
    .select("*")
    .eq("razorpay_order_id", orderId)
    .maybeSingle()

  if (!txn) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  if (event.event === "payment.captured") {
    // Only process if not already captured (verify endpoint may have handled it)
    if (txn.status === "captured") {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    await serviceSupabase
      .from("payment_transactions")
      .update({ status: "captured", razorpay_payment_id: paymentId ?? null })
      .eq("id", txn.id)

    const meta = txn.metadata as { plan?: string | null; credits?: number | null } | null
    const userId = txn.user_id

    if (meta?.plan === "pro_monthly") {
      const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: profile } = await serviceSupabase
        .from("user_profiles")
        .select("credit_balance")
        .eq("id", userId)
        .single()
      const currentBalance = (profile as unknown as { credit_balance?: number } | null)?.credit_balance ?? 0

      await serviceSupabase.from("user_profiles").update({
        plan: "pro",
        plan_expires_at: planExpiresAt,
        credit_balance: currentBalance + 1000,
      } as never).eq("id", userId)

      await serviceSupabase.from("credit_transactions").insert({
        user_id: userId,
        type: "pro_signup",
        amount: 1000,
        balance_after: currentBalance + 1000,
        description: "Pro plan activation — 1000 credits (webhook)",
        payment_transaction_id: txn.id,
      } as never)
    } else if (meta?.credits && meta.credits > 0) {
      const { data: profile } = await serviceSupabase
        .from("user_profiles")
        .select("credit_balance")
        .eq("id", userId)
        .single()
      const currentBalance = (profile as unknown as { credit_balance?: number } | null)?.credit_balance ?? 0
      const newBalance = currentBalance + meta.credits

      await serviceSupabase.from("user_profiles").update({
        credit_balance: newBalance,
      } as never).eq("id", userId)

      await serviceSupabase.from("credit_transactions").insert({
        user_id: userId,
        type: "purchase",
        amount: meta.credits,
        balance_after: newBalance,
        description: `Purchased ${meta.credits} credits (webhook)`,
        payment_transaction_id: txn.id,
      } as never)
    }
  } else if (event.event === "payment.failed") {
    if (txn.status !== "captured") {
      await serviceSupabase
        .from("payment_transactions")
        .update({ status: "failed" })
        .eq("id", txn.id)
    }
  }

  // Always return 200
  return NextResponse.json({ ok: true }, { status: 200 })
}
