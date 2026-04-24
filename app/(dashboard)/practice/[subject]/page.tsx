import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ChevronRight } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getChaptersForSubject } from "@/lib/queries/practice"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function SubjectPracticePage({
  params,
}: {
  params: { subject: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const result = await getChaptersForSubject(params.subject, user?.id ?? "")
  if (!result) notFound()

  const { subject, chapters } = result

  return (
    <div className="grid gap-4">
      {/* ── Back navigation — compact on mobile ── */}
      <Link
        href="/practice"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] -ml-1 w-fit"
      >
        <ArrowLeft className="size-4" />
        Practice
      </Link>

      <div>
        <h1 className="text-xl font-bold tracking-tight">{subject.name}</h1>
        <p className="text-sm text-muted-foreground">
          {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} — pick one to drill into
        </p>
      </div>

      <div className="grid gap-2">
        {chapters.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No chapters set up yet for {subject.name}.
          </div>
        ) : (
          chapters.map((c) => (
            <Link
              key={c.id}
              href={`/practice/${subject.slug}/${c.slug}`}
              className={cn(
                "group flex min-h-[64px] items-center gap-4 rounded-xl border bg-card px-4 py-3",
                "transition-all duration-150",
                c.questionCount > 0
                  ? "hover:border-primary/40 hover:shadow-sm"
                  : "pointer-events-none opacity-50"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{c.name}</h3>
                  {c.weightagePercent != null ? (
                    <Badge variant="secondary" className="text-xs">
                      {c.weightagePercent}% weight
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{c.questionCount} question{c.questionCount !== 1 ? "s" : ""}</span>
                  {c.userAttempted > 0 ? (
                    <>
                      <span>·</span>
                      <span>
                        <strong className="text-foreground">{c.userAccuracy ?? 0}%</strong> accuracy
                      </span>
                    </>
                  ) : (
                    <>
                      <span>·</span>
                      <span>Not started</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
