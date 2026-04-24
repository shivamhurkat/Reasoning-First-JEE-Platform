"use client"

import { cn } from "@/lib/utils"

export const DIFFICULTY_OPTIONS = [
  { value: 1, label: "Easy", tone: "emerald" },
  { value: 2, label: "Easy-Medium", tone: "lime" },
  { value: 3, label: "Medium", tone: "amber" },
  { value: 4, label: "Medium-Hard", tone: "orange" },
  { value: 5, label: "Hard", tone: "red" },
] as const

export function DifficultyPicker({
  value,
  onChange,
  disabled,
  size = "default",
}: {
  value: number
  onChange: (next: number) => void
  disabled?: boolean
  size?: "default" | "sm"
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Difficulty"
      className={cn(
        "grid grid-cols-5 gap-2",
        size === "sm" && "gap-1"
      )}
    >
      {DIFFICULTY_OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            type="button"
            key={opt.value}
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "group flex flex-col items-center justify-center rounded-lg border px-2 text-center transition-all outline-none select-none",
              "focus-visible:ring-3 focus-visible:ring-ring/40",
              size === "sm" ? "py-1.5" : "py-2",
              active
                ? toneActive[opt.tone]
                : "border-border bg-background hover:bg-muted",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <span
              className={cn(
                "font-semibold",
                size === "sm" ? "text-sm" : "text-base",
                active ? "" : "text-muted-foreground"
              )}
            >
              {opt.value}
            </span>
            <span
              className={cn(
                "leading-tight",
                size === "sm" ? "text-[10px]" : "text-xs",
                active ? "" : "text-muted-foreground"
              )}
            >
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Tailwind must see the full class name literally for it to be generated,
// so these are explicit strings rather than interpolated.
const toneActive: Record<(typeof DIFFICULTY_OPTIONS)[number]["tone"], string> = {
  emerald:
    "border-emerald-500/70 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  lime: "border-lime-500/70 bg-lime-50 text-lime-900 dark:bg-lime-950/40 dark:text-lime-100",
  amber:
    "border-amber-500/70 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  orange:
    "border-orange-500/70 bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-100",
  red: "border-red-500/70 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100",
}
