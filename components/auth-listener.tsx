"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function AuthListener() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // If we are on a public route and the user successfully signed in via OAuth
      // (which sometimes redirects with #access_token to the Site URL), redirect to dashboard
      if (session) {
        if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
          router.push("/dashboard")
          router.refresh()
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname, supabase.auth])

  return null
}
