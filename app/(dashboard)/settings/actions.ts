"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type Result = { ok: true } | { ok: false; error: string }

export async function updateProfile(formData: FormData): Promise<Result> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated" }

  const full_name = (formData.get("full_name") as string)?.trim() || null
  if (full_name && full_name.length < 2)
    return { ok: false, error: "Name must be at least 2 characters" }

  const phone = (formData.get("phone") as string)?.trim() || null
  if (phone && !/^\+?[\d\s\-().]{7,20}$/.test(phone))
    return { ok: false, error: "Invalid phone number" }

  const target_exam = (formData.get("target_exam") as string) || null
  const validExams = ["jee_mains", "jee_advanced", "neet", "other"]
  if (target_exam && !validExams.includes(target_exam))
    return { ok: false, error: "Invalid target exam" }

  const class_level = (formData.get("class_level") as string) || null
  const validLevels = ["11", "12", "dropper"]
  if (class_level && !validLevels.includes(class_level))
    return { ok: false, error: "Invalid class level" }

  const target_year_raw = (formData.get("target_year") as string)?.trim()
  const target_year = target_year_raw ? parseInt(target_year_raw, 10) : null
  if (target_year && (isNaN(target_year) || target_year < 2024 || target_year > 2035))
    return { ok: false, error: "Target year must be between 2024 and 2035" }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      full_name,
      phone,
      class_level,
      target_year,
      ...(target_exam ? { target_exam } : {}),
    })
    .eq("id", user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/", "layout")
  return { ok: true }
}

export async function changePassword(formData: FormData): Promise<Result> {
  const newPassword = (formData.get("new_password") as string) ?? ""
  const confirmPassword = (formData.get("confirm_password") as string) ?? ""

  if (newPassword.length < 6)
    return { ok: false, error: "Password must be at least 6 characters" }
  if (newPassword !== confirmPassword)
    return { ok: false, error: "Passwords do not match" }

  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
