"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type OnboardingData = {
  user_type?: "student" | "teacher" | "contributor" | "parent" | "other"
  target_exam?: string
  class_level?: string
  target_year?: number
  coaching_institute?: string
  city?: string
}

export async function saveOnboarding(data: OnboardingData = {}): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: "Not authenticated" }
  }

  const updatePayload: Record<string, unknown> = {
    onboarding_completed: true,
    onboarded_at: new Date().toISOString(),
  }

  if (data.user_type) updatePayload.user_type = data.user_type
  if (data.target_exam) updatePayload.target_exam = data.target_exam
  if (data.class_level) updatePayload.class_level = data.class_level
  if (data.target_year) updatePayload.target_year = data.target_year
  if (data.coaching_institute !== undefined) updatePayload.coaching_institute = data.coaching_institute || null
  if (data.city !== undefined) updatePayload.city = data.city || null

  const { error } = await supabase
    .from("user_profiles")
    .update(updatePayload)
    .eq("id", user.id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { ok: true }
}
