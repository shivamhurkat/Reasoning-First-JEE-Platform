import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { razorpay } from "@/lib/razorpay"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database.types"

const bodySchema = z.object({
  amount_inr: z.number().positive(),
  plan: z.enum(["pro_monthly"]).optional(),
  credits: z.number().positive().optional(),
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

  const amountPaise = Math.round(body.amount_inr * 100)
  const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now()}`

  // Create Razorpay order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any
  try {
    order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
    })
  } catch (err) {
    console.error("Razorpay create order error:", err)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }

  // Use service role to insert payment_transactions (bypasses RLS)
  const serviceSupabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const metadata = {
    plan: body.plan ?? null,
    credits: body.credits ?? null,
  }

  const { error: dbError } = await serviceSupabase.from("payment_transactions").insert({
    user_id: user.id,
    razorpay_order_id: order.id,
    amount_inr: body.amount_inr,
    status: "created",
    metadata,
  })

  if (dbError) {
    console.error("DB insert error:", dbError.message)
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 })
  }

  return NextResponse.json({
    order_id: order.id,
    amount: amountPaise,
    currency: "INR",
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  })
}
