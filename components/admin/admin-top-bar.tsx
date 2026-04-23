"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, ShieldAlert } from "lucide-react"

import { cn } from "@/lib/utils"

const ADMIN_NAV = [
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/questions/new", label: "New Question" },
]

export function AdminTopBar({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <header className="border-b border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/30">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <ShieldAlert className="size-4" />
          <span className="text-sm font-semibold">Admin Mode</span>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {ADMIN_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
                  active
                    ? "bg-amber-200/60 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"
                    : "text-amber-800/80 hover:bg-amber-200/40 hover:text-amber-900 dark:text-amber-200/80 dark:hover:bg-amber-900/30"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-xs text-amber-800/80 dark:text-amber-200/70">
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
