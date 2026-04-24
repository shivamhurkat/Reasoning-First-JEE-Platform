"use client"

import { useFormStatus } from "react-dom"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { startSession } from "@/app/(dashboard)/practice/actions"

type Scope = "topic" | "chapter" | "subject" | "mixed"

export function StartSessionForm({
  scope,
  scopeId,
  children,
  className,
  variant,
  size,
  disabled,
  disabledReason,
}: {
  scope: Scope
  scopeId?: string
  children: React.ReactNode
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  disabled?: boolean
  disabledReason?: string
}) {
  if (disabled) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled
        className={className}
        title={disabledReason}
      >
        {children}
      </Button>
    )
  }

  return (
    <form action={startSession} className={cn("inline-flex", className)}>
      <input type="hidden" name="scope" value={scope} />
      {scopeId ? (
        <input type="hidden" name="scopeId" value={scopeId} />
      ) : null}
      <SubmitButton variant={variant} size={size}>
        {children}
      </SubmitButton>
    </form>
  )
}

function SubmitButton({
  children,
  variant,
  size,
}: {
  children: React.ReactNode
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending}>
      {pending ? "Starting..." : children}
    </Button>
  )
}
