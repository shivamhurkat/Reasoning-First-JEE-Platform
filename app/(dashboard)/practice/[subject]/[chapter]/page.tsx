import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, Layers, Play } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getTopicsForChapter } from "@/lib/queries/practice"
import { Badge } from "@/components/ui/badge"
import { StartSessionForm } from "@/components/practice/start-session-form"

export const dynamic = "force-dynamic"

export default async function ChapterPracticePage({
  params,
}: {
  params: { subject: string; chapter: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const result = await getTopicsForChapter(
    params.subject,
    params.chapter,
    user?.id ?? ""
  )
  if (!result) notFound()

  const { chapter, topics } = result
  const chapterTotalQuestions = topics.reduce(
    (sum, t) => sum + t.questionCount,
    0
  )

  return (
    <div className="grid gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/practice" className="hover:text-foreground">
          Practice
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/practice/${chapter.subject.slug}`}
          className="hover:text-foreground"
        >
          {chapter.subject.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{chapter.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {chapter.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {topics.length} topic{topics.length === 1 ? "" : "s"} ·{" "}
            {chapterTotalQuestions} question
            {chapterTotalQuestions === 1 ? "" : "s"} available
          </p>
        </div>
        <StartSessionForm
          scope="chapter"
          scopeId={chapter.id}
          disabled={chapterTotalQuestions === 0}
          disabledReason={
            chapterTotalQuestions === 0
              ? "No questions yet in this chapter"
              : undefined
          }
        >
          <Layers /> Practice entire chapter
        </StartSessionForm>
      </div>

      <div className="grid gap-2">
        {topics.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No topics set up yet for {chapter.name}.
          </div>
        ) : (
          topics.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{t.name}</h3>
                  <Badge variant="outline">
                    {t.questionCount} q{t.questionCount === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {t.userAttempted > 0 ? (
                    <>
                      <span>
                        <strong className="text-foreground">
                          {t.userAccuracy ?? 0}%
                        </strong>{" "}
                        accuracy
                      </span>
                      <span>·</span>
                      <span>{t.userAttempted} attempted</span>
                    </>
                  ) : (
                    <span>Not started</span>
                  )}
                </div>
              </div>
              <StartSessionForm
                scope="topic"
                scopeId={t.id}
                variant="outline"
                size="sm"
                disabled={t.questionCount === 0}
                disabledReason={
                  t.questionCount === 0
                    ? "No questions yet for this topic"
                    : undefined
                }
              >
                <Play /> Start practice
              </StartSessionForm>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
