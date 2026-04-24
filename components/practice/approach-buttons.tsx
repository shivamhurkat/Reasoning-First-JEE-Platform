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
      /* Mobile: 2-column grid, Skip (last item) spans both columns.
         Desktop (md+): back to 5-column. */
      className="grid grid-cols-2 gap-2 md:grid-cols-5"
    >
      {APPROACHES.map((a) => {
        const Icon = a.icon
        const isSkip = a.id === "skip"
        return (
          <button
            type="button"
            key={a.id}
            role="radio"
            aria-checked={false}
            disabled={disabled}
            onClick={() => onSelect(a.id)}
            className={cn(
              /* Layout: horizontal on mobile (icon + text side by side),
                 vertical on desktop (original tall card). */
              "group flex items-center gap-3 rounded-xl border bg-card text-left",
              "px-3 py-3 md:min-h-[80px] md:flex-col md:items-start md:gap-2 md:p-4",
              "min-h-[56px]", // 56px — well above 44px touch target
              "transition-all duration-150 outline-none",
              "hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm",
              "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40",
              "active:scale-[0.98]",
              isSkip
                ? "hover:border-muted-foreground/40 col-span-2 md:col-span-1"
                : "",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                isSkip ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
              )}
            >
              <Icon className="size-4" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1 md:flex-none">
              <div className="font-medium text-sm leading-tight">{a.label}</div>
              <div className="mt-0.5 hidden text-xs text-muted-foreground md:block">{a.blurb}</div>
            </div>

            {/* Keyboard shortcut — desktop only */}
            <kbd className="ml-auto hidden rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-flex md:ml-0">
              {a.shortcut}
            </kbd>
          </button>
        )
      })}
    </div>
  )
}
