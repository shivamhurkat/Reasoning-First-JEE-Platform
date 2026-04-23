"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BookOpen,
  Home,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
}

const BASE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
]

export type AppShellProfile = {
  id: string
  email: string
  full_name: string | null
  role: string
}

export function AppShell({
  profile,
  children,
}: {
  profile: AppShellProfile
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav =
    profile.role === "admin"
      ? [
          ...BASE_NAV,
          { href: "/admin", label: "Admin", icon: ShieldCheck } as NavItem,
        ]
      : BASE_NAV

  const sidebarContent = (
    <SidebarBody
      nav={nav}
      profile={profile}
      onNavigate={() => setMobileOpen(false)}
    />
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile: hamburger + Sheet */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
          <span className="font-semibold tracking-tight">
            Reasoning-First JEE
          </span>
        </header>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

function SidebarBody({
  nav,
  profile,
  onNavigate,
}: {
  nav: NavItem[]
  profile: AppShellProfile
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const displayName = profile.full_name?.trim() || profile.email

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="text-base font-semibold tracking-tight"
        >
          Reasoning-First JEE
        </Link>
      </div>
      <Separator />

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="grid gap-1">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator />
      <div className="p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile.email}
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
