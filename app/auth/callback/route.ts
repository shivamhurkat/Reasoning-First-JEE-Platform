import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

// Handles both Google OAuth redirects and email confirmation/reset links.
// Supabase sends the user back here with a one-time `code`; we exchange it for
// a session cookie, then forward to a safe `next` path (or `/`).
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const rawNext = url.searchParams.get("next") ?? "/"
  // Detect email-confirmation callbacks so we can redirect to /login?verified=true
  const callbackType = url.searchParams.get("type") // "signup" for email confirmation
  // Only allow same-origin redirects to avoid open-redirect abuse.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/"

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", request.url)
    )
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", request.url)
    )
  }

  // Email signup confirmation → send to login with a verified banner
  if (callbackType === "signup") {
    return NextResponse.redirect(new URL("/login?verified=true", request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}
