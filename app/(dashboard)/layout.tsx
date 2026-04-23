import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { AppShell, type AppShellProfile } from "@/components/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single()

  // Fallback if the profile row hasn't been created yet (trigger lag) — the
  // auth user always has an email, so we can render from it.
  const profile: AppShellProfile = {
    id: user.id,
    email: profileRow?.email ?? user.email ?? "",
    full_name: profileRow?.full_name ?? null,
    role: profileRow?.role ?? "student",
  }

  return <AppShell profile={profile}>{children}</AppShell>
}
