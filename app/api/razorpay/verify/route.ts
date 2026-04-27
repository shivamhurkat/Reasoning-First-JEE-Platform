import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database.types"

const bodySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Validate body
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // Verify signature: HMAC-SHA256(order_id + "|" + payment_id, secret)
  const secret = process.env.RAZORPAY_KEY_SECRET!
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest("hex")

  const serviceSupabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (expectedSig !== body.razorpay_signature) {
    // Signature mismatch — mark as failed
    await serviceSupabase
      .from("payment_transactions")
      .update({ status: "failed" })
      .eq("razorpay_order_id", body.razorpay_order_id)
      .eq("user_id", user.id)

    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
  }

  // Fetch the transaction to determine what was purchased
  const { data: txn } = await serviceSupabase
    .from("payment_transactions")
    .select("*")
    .eq("razorpay_order_id", body.razorpay_order_id)
    .eq("user_id", user.id)
    .single()

  if (!txn) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  // Mark as captured
  await serviceSupabase
    .from("payment_transactions")
    .update({
      status: "captured",
      razorpay_payment_id: body.razorpay_payment_id,
    })
    .eq("id", txn.id)

  const meta = txn.metadata as { plan?: string | null; credits?: number | null } | null

  // --- Pro plan purchase ---
  if (meta?.plan === "pro_monthly") {
    const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Update user_profiles: set plan, plan_expires_at, add 1000 credits
    const { data: profile } = await serviceSupabase
      .from("user_profiles")
      .select("credit_balance")
      .eq("id", user.id)
      .single()

    const currentBalance = (profile as unknown as { credit_balance?: number } | null)?.credit_balance ?? 0

    await serviceSupabase.from("user_profiles").update({
      plan: "pro",
      plan_expires_at: planExpiresAt,
      credit_balance: currentBalance + 1000,
    } as never).eq("id", user.id)

    // Log credit_transaction
    await serviceSupabase.from("credit_transactions").insert({
      user_id: user.id,
      type: "pro_signup",
      amount: 1000,
      balance_after: currentBalance + 1000,
      description: "Pro plan activation — 1000 credits",
      payment_transaction_id: txn.id,
    } as never)

    return NextResponse.json({ success: true, plan: "pro", credits_added: 1000 })
  }

  // --- Credit top-up purchase ---
  if (meta?.credits && meta.credits > 0) {
    const creditsToAdd = meta.credits

    const { data: profile } = await serviceSupabase
      .from("user_profiles")
      .select("credit_balance")
      .eq("id", user.id)
      .single()

    const currentBalance = (profile as unknown as { credit_balance?: number } | null)?.credit_balance ?? 0
    const newBalance = currentBalance + creditsToAdd

    await serviceSupabase.from("user_profiles").update({
      credit_balance: newBalance,
    } as never).eq("id", user.id)

    await serviceSupabase.from("credit_transactions").insert({
      user_id: user.id,
      type: "purchase",
      amount: creditsToAdd,
      balance_after: newBalance,
      description: `Purchased ${creditsToAdd} credits`,
      payment_transaction_id: txn.id,
    } as never)

    return NextResponse.json({ success: true, credits_added: creditsToAdd, new_balance: newBalance })
  }

  return NextResponse.json({ success: true })
}
