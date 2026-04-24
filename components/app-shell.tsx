"use client"

import Link from "next/link"
import { useState } from "react"
import {
  BookOpen,
  Home,
  LogOut,
  Settings,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarNav, type NavItem } from "@/components/dashboard/sidebar-nav"
import { MobileHeader } from "@/components/dashboard/mobile-header"

export type AppShellProfile = {
  id: string
  email: string
  full_name: string | null
  role: string
}

const BASE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppShell({
  profile,
  children,
}: {
  profile: AppShellProfile
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav: NavItem[] =
    profile.role === "admin"
      ? [
          ...BASE_NAV,
          { href: "/admin", label: "Admin", icon: ShieldCheck },
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
      {/* Desktop sidebar — hidden below lg */}
      <aside className="hidden w-60 shrink-0 border-r bg-card lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar — hidden at lg+ */}
        <MobileHeader
          profile={profile}
          onMenuClick={() => setMobileOpen(true)}
        />

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
  const displayName = profile.full_name?.trim() || profile.email

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="text-base font-semibold tracking-tight transition-colors duration-150 hover:text-primary"
        >
          Reasoning-First JEE
        </Link>
      </div>
      <Separator />

      <nav className="flex-1 overflow-y-auto p-3">
        <SidebarNav items={nav} onNavigate={onNavigate} />
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
