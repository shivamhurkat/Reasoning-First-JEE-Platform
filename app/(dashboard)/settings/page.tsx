import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "./settings-client"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [profileRes, countRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select(
        "full_name, phone, target_exam, class_level, target_year, xp_total, current_streak, created_at"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("practice_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ])

  const profile = profileRes.data ?? {
    full_name: null,
    phone: null,
    target_exam: "jee_mains",
    class_level: null,
    target_year: null,
    xp_total: 0,
    current_streak: 0,
    created_at: new Date().toISOString(),
  }

  return (
    <SettingsClient
      email={user.email ?? ""}
      profile={profile}
      attemptsCount={countRes.count ?? 0}
    />
  )
}
