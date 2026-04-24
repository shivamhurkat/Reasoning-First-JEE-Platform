import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, ChevronRight } from "lucide-react"

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const result = await getChaptersForSubject(params.subject, user?.id ?? "")
  if (!result) notFound()

  const { subject, chapters } = result

  return (
    <div className="grid gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/practice" className="hover:text-foreground">
          Practice
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{subject.name}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {subject.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {chapters.length} chapter{chapters.length === 1 ? "" : "s"} · pick one
          to drill into its topics.
        </p>
      </div>

      <div className="grid gap-3">
        {chapters.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No chapters set up yet for {subject.name}.
          </div>
        ) : (
          chapters.map((c) => (
            <Link
              key={c.id}
              href={`/practice/${subject.slug}/${c.slug}`}
              className={cn(
                "group rounded-xl border bg-card p-4 transition-all",
                c.questionCount > 0
                  ? "hover:border-primary/40 hover:shadow-sm"
                  : "opacity-60"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{c.name}</h3>
                    {c.weightagePercent != null ? (
                      <Badge variant="secondary">
                        {c.weightagePercent}% weight
                      </Badge>
                    ) : null}
                    <Badge variant="outline">
                      {c.questionCount} q
                      {c.questionCount === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {c.userAttempted > 0 ? (
                      <>
                        <span>
                          <strong className="text-foreground">
                            {c.userAccuracy ?? 0}%
                          </strong>{" "}
                          accuracy
                        </span>
                        <span>·</span>
                        <span>{c.userAttempted} attempted</span>
                      </>
                    ) : (
                      <span>Not started</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
