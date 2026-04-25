import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { AdminTopBar } from "@/components/admin/admin-top-bar"

export default async function AdminLayout({
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

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminTopBar email={user.email ?? ""} />
      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  )
}