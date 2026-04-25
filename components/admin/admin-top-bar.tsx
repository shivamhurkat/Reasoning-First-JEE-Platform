"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import { useMemo } from "react"

import { cn } from "@/lib/utils"

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/subjects", label: "Curriculum" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/questions/new", label: "New Question" },
  { href: "/admin/import", label: "Import" },
]

export function AdminTopBar({ email }: { email: string }) {
  const pathname = usePathname()

  // Longest-prefix match: only the deepest nav entry whose href is a prefix
  // of the current path wins. This avoids both "Questions" AND "New Question"
  // lighting up on /admin/questions/new.
  const activeHref = useMemo(() => {
    let best: string | null = null
    for (const item of ADMIN_NAV) {
      const matches =
        pathname === item.href ||
        pathname === `${item.href}/` ||
        pathname.startsWith(`${item.href}/`)
      if (!matches) continue
      if (best === null || item.href.length > best.length) best = item.href
    }
    return best
  }, [pathname])

  return (
    <header className="sticky top-0 z-30 border-b border-amber-400/50 bg-amber-50/80 backdrop-blur supports-[backdrop-filter]:bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/40">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-2">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <ShieldAlert className="size-4" />
          <span className="text-sm font-semibold tracking-tight">Admin</span>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {ADMIN_NAV.map((item) => {
            const active = activeHref === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  "rounded-md px-2.5 py-1 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-amber-200/70 text-amber-950 shadow-inner dark:bg-amber-900/60 dark:text-amber-50"
                    : "text-amber-900/70 hover:bg-amber-200/40 hover:text-amber-950 dark:text-amber-200/80 dark:hover:bg-amber-900/30"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-xs text-amber-900/70 dark:text-amber-200/70">
          <span className="hidden sm:inline">{email}</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-amber-200/40 dark:hover:bg-amber-900/30"
          >
            <ArrowLeft className="size-3" />
            Back to app
          </Link>
        </div>
      </div>
    </header>
  )
}
