"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { endSessionAndGoToSummary } from "@/app/(dashboard)/practice/actions"

export function SessionExhausted({
  sessionId,
  scopeLabel,
  attemptsSoFar,
}: {
  sessionId: string
  scopeLabel: string
  attemptsSoFar: number
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
      <CheckCircle2 className="size-12 text-emerald-600" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        You&apos;ve attempted every question in {scopeLabel}.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {attemptsSoFar} question{attemptsSoFar === 1 ? "" : "s"} this session.
        Great work — wrap up or switch topic to keep going.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <form action={endSessionAndGoToSummary}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <Button type="submit">End session</Button>
        </form>
        <Button render={<Link href="/practice" />} variant="outline">
          Switch topic
        </Button>
      </div>
    </div>
  )
}
