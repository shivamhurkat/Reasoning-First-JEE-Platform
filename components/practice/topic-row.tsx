"use client"

import { useFormStatus } from "react-dom"
import { Loader2, Play } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { startSession } from "@/app/(dashboard)/practice/actions"

type TopicData = {
  id: string
  name: string
  questionCount: number
  userAttempted: number
  userAccuracy: number | null
}

function RowButton({
  name,
  questionCount,
  userAttempted,
  userAccuracy,
}: Omit<TopicData, "id">) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "flex w-full min-h-[64px] items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left",
        "transition-all duration-150 hover:border-primary/40 hover:shadow-sm cursor-pointer",
        pending && "opacity-70 pointer-events-none"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{name}</h3>
          <Badge variant="outline" className="text-xs">
            {questionCount} q{questionCount !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {userAttempted > 0 ? (
            <span>
              <strong className="text-foreground">{userAccuracy ?? 0}%</strong> accuracy
              {" · "}{userAttempted} attempted
            </span>
          ) : (
            <span>Not started</span>
          )}
        </div>
      </div>
      {pending ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <Play className="size-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  )
}

export function TopicRow({ id, name, questionCount, userAttempted, userAccuracy }: TopicData) {
  if (questionCount === 0) {
    return (
      <div className="flex min-h-[64px] items-center gap-3 rounded-xl border bg-card px-4 py-3 opacity-50">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{name}</h3>
            <Badge variant="outline" className="text-xs">0 qs</Badge>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">No questions yet</div>
        </div>
      </div>
    )
  }

  return (
    <form action={startSession}>
      <input type="hidden" name="scope" value="topic" />
      <input type="hidden" name="scopeId" value={id} />
      <RowButton
        name={name}
        questionCount={questionCount}
        userAttempted={userAttempted}
        userAccuracy={userAccuracy}
      />
    </form>
  )
}
