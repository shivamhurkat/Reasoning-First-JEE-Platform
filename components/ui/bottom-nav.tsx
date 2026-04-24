"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BookOpen,
  Calendar,
  Home,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match: (p: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    match: (p) => p === "/",
  },
  {
    href: "/practice",
    label: "Practice",
    icon: BookOpen,
    match: (p) => p.startsWith("/practice"),
  },
  {
    href: "/daily",
    label: "Daily",
    icon: Calendar,
    match: (p) => p === "/daily",
  },
  {
    href: "/progress",
    label: "Progress",
    icon: TrendingUp,
    match: (p) => p === "/progress",
  },
]

export function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Hide entirely during practice sessions — the session overlay covers everything
  // but we also hide so it doesn't render behind the overlay.
  if (pathname.includes("/practice/session/")) return null

  const isMoreActive =
    pathname === "/settings" ||
    (role === "admin" && pathname.startsWith("/admin"))

  return (
    <>
      {/* Bottom navigation bar — ONLY visible below lg breakpoint.
          glass-card is safe here because this is a FIXED element. */}
      <nav
        aria-label="Main navigation"
        className={cn(
          "fixed bottom-0 inset-x-0 z-30 lg:hidden",
          "glass-card border-t border-border/60",
          "flex items-stretch",
          /* safe area for phones with gesture bar */
          "pb-[env(safe-area-inset-bottom)]"
        )}
        style={{ height: "calc(64px + env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2",
                "transition-colors duration-150",
                "min-h-[44px]", // minimum touch target
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-150",
                  active && "scale-110"
                )}
              />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* "More" button opens a sheet */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          aria-label="More options"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-2",
            "transition-colors duration-150 min-h-[44px]",
            isMoreActive
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Menu className="size-5" />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>

      {/* More sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0">
          <SheetHeader className="px-6 pb-2">
            <SheetTitle className="text-left text-base">Menu</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col pb-[env(safe-area-inset-bottom)]">
            <Link
              href="/settings"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 px-6 py-4 text-sm hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </Link>

            {role === "admin" ? (
              <Link
                href="/admin/questions"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-6 py-4 text-sm hover:bg-muted/50 transition-colors min-h-[44px]"
              >
                <ShieldCheck className="size-4 text-muted-foreground" />
                Admin panel
              </Link>
            ) : null}

            <div className="mx-6 my-1 border-t" />

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-6 py-4 text-sm text-destructive hover:bg-destructive/5 transition-colors min-h-[44px]"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
