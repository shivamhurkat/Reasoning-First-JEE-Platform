import { createClient } from "@/lib/supabase/server"

export default async function DashboardHomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from("user_profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()
    : { data: null }

  const greeting =
    profile?.full_name?.trim() ||
    profile?.email ||
    user?.email ||
    "there"

  return (
    <div className="grid gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {greeting}
      </h1>
      <p className="text-muted-foreground">
        Your dashboard is ready. Pick a section from the sidebar to get started.
      </p>
    </div>
  )
}
