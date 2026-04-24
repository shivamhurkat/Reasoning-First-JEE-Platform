"use client"

import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AppShellProfile } from "@/components/app-shell"

export function MobileHeader({
  profile,
  onMenuClick,
}: {
  profile: AppShellProfile
  onMenuClick: () => void
}) {
  const initial = (
    profile.full_name?.trim() || profile.email
  )
    .charAt(0)
    .toUpperCase()

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4 lg:hidden">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Open menu"
        onClick={onMenuClick}
      >
        <Menu />
      </Button>
      <span className="flex-1 font-semibold tracking-tight">
        Reasoning-First JEE
      </span>
      <div className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {initial}
      </div>
    </header>
  )
}
