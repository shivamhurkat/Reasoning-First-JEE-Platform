"use client"

import { cn } from "@/lib/utils"
import { APPROACHES, type ApproachId } from "@/lib/constants/practice"

export function ApproachButtons({
  onSelect,
  disabled,
}: {
  onSelect: (id: ApproachId) => void
  disabled?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose your approach"
      className="grid gap-2 md:grid-cols-5"
    >
      {APPROACHES.map((a) => {
        const Icon = a.icon
        return (
          <button
            type="button"
            key={a.id}
            role="radio"
            aria-checked={false}
            disabled={disabled}
            onClick={() => onSelect(a.id)}
            className={cn(
              "group flex min-h-28 flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left",
              "transition-all duration-150 outline-none",
              "hover:border-primary/50 hover:bg-muted/40 hover:shadow-md hover:scale-[1.02]",
              "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40",
              "active:scale-[0.98]",
              a.id === "skip" && "hover:border-muted-foreground/40",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <div className="flex w-full items-center justify-between">
              <div
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-lg",
                  a.id === "skip"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                <Icon className="size-4" />
              </div>
              <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {a.shortcut}
              </kbd>
            </div>
            <div>
              <div className="font-medium">{a.label}</div>
              <div className="text-xs text-muted-foreground">{a.blurb}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
