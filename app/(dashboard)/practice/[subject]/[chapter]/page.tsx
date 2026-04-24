import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Play } from "lucide-react"

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
  const { data: { user } } = await supabase.auth.getUser()

  const result = await getTopicsForChapter(params.subject, params.chapter, user?.id ?? "")
  if (!result) notFound()

  const { chapter, topics } = result
  const chapterTotalQuestions = topics.reduce((sum, t) => sum + t.questionCount, 0)

  return (
    /* Extra pb so topics list clears the sticky bottom bar on mobile */
    <div className="grid gap-4 pb-24 lg:pb-4">
      {/* ── Back navigation ── */}
      <Link
        href={`/practice/${chapter.subject.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] -ml-1 w-fit"
      >
        <ArrowLeft className="size-4" />
        {chapter.subject.name}
      </Link>

      <div>
        <h1 className="text-xl font-bold tracking-tight">{chapter.name}</h1>
        <p className="text-sm text-muted-foreground">
          {topics.length} topic{topics.length !== 1 ? "s" : ""} · {chapterTotalQuestions} question
          {chapterTotalQuestions !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* ── Topic list ── */}
      <div className="grid gap-2">
        {topics.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No topics set up yet for {chapter.name}.
          </div>
        ) : (
          topics.map((t) => (
            <div
              key={t.id}
              className="flex min-h-[64px] items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{t.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {t.questionCount} q{t.questionCount !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t.userAttempted > 0 ? (
                    <span>
                      <strong className="text-foreground">{t.userAccuracy ?? 0}%</strong> accuracy
                      {" · "}{t.userAttempted} attempted
                    </span>
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
                disabledReason={t.questionCount === 0 ? "No questions yet" : undefined}
              >
                <Play /> Start
              </StartSessionForm>
            </div>
          ))
        )}
      </div>

      {/* ── Sticky bottom CTA: "Practice entire chapter" ──
           Stays at the bottom so it doesn't get buried on long lists.
           Uses a plain white background — NO backdrop-filter on scrollable page. */}
      {chapterTotalQuestions > 0 ? (
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] inset-x-0 z-20 border-t bg-background px-4 py-3 lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:bottom-auto">
          <StartSessionForm
            scope="chapter"
            scopeId={chapter.id}
            className="w-full lg:w-auto min-h-[48px]"
          >
            Practice entire chapter — {chapterTotalQuestions} questions
          </StartSessionForm>
        </div>
      ) : null}
    </div>
  )
}
