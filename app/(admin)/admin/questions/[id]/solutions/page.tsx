import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MathPreview } from "@/components/math-preview"
import { SolutionsManager } from "@/components/admin/solutions-manager"

export const dynamic = "force-dynamic"

export default async function ManageSolutionsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [qRes, sRes] = await Promise.all([
    supabase
      .from("questions")
      .select(
        "id, question_text, question_image_url, question_type, options, correct_answer, difficulty, status, source, year, topics(name, chapters(name, subjects(name)))"
      )
      .eq("id", params.id)
      .single(),
    supabase
      .from("solutions")
      .select("*")
      .eq("question_id", params.id)
      .order("created_at", { ascending: true }),
  ])

  if (qRes.error || !qRes.data) notFound()

  const q = qRes.data as unknown as {
    id: string
    question_text: string
    question_image_url: string | null
    question_type: "single_correct" | "multi_correct" | "numerical" | "subjective"
    options: { id: string; text: string }[] | null
    correct_answer:
      | { type: "single"; value: string }
      | { type: "multi"; values: string[] }
      | { type: "numerical"; value: number; tolerance?: number }
      | { type: "subjective"; value: string }
      | null
    difficulty: number
    status: "draft" | "published" | "archived" | "flagged"
    source: string | null
    year: number | null
    topics: {
      name: string
      chapters: { name: string; subjects: { name: string } | null } | null
    } | null
  }

  const topic = q.topics
  const chapter = topic?.chapters
  const subject = chapter?.subjects

  const correctSet =
    q.correct_answer?.type === "single"
      ? new Set([q.correct_answer.value])
      : q.correct_answer?.type === "multi"
        ? new Set(q.correct_answer.values)
        : new Set<string>()

  const solutions = (sRes.data ?? []) as unknown as Array<{
    id: string
    question_id: string
    solution_type:
      | "standard"
      | "logical"
      | "elimination"
      | "shortcut"
      | "trap_warning"
      | "pattern"
    title: string | null
    content: string
    solution_image_url: string | null
    steps: { step_number: number; text: string; explanation?: string | null }[] | null
    time_estimate_seconds: number | null
    when_to_use: string | null
    when_not_to_use: string | null
    prerequisites: string | null
    difficulty_to_execute: number | null
    status: "draft" | "published" | "ai_generated_unverified" | "flagged"
  }>

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/admin/questions"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back to questions
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Manage solutions
            </h1>
            <p className="text-sm text-muted-foreground">
              Populate the reasoning-first solution types for this question.
            </p>
          </div>
          <Button
            render={<Link href={`/admin/questions/${q.id}/edit`} />}
            variant="outline"
          >
            <Pencil /> Edit question
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <span>Question preview</span>
            <Badge variant="secondary">Difficulty {q.difficulty}</Badge>
            <Badge variant="outline">{q.question_type}</Badge>
            <Badge>{q.status}</Badge>
            {q.source ? (
              <span className="text-xs text-muted-foreground">
                {q.source}
                {q.year ? ` · ${q.year}` : ""}
              </span>
            ) : null}
          </CardTitle>
          {topic ? (
            <p className="text-xs text-muted-foreground">
              {subject?.name ?? "—"} › {chapter?.name ?? "—"} › {topic.name}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4">
          {q.question_image_url ? (
            <div className="overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={q.question_image_url}
                alt="Question"
                className="w-full object-contain max-h-[500px]"
              />
            </div>
          ) : null}
          {q.question_text ? (
            <MathPreview value={q.question_text} />
          ) : null}

          {q.options && q.options.length > 0 ? (
            <div className="grid gap-1.5">
              {q.options.map((opt) => {
                const correct = correctSet.has(opt.id)
                return (
                  <div
                    key={opt.id}
                    className={
                      correct
                        ? "flex items-start gap-2 rounded-md border border-emerald-500/50 bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30"
                        : "flex items-start gap-2 rounded-md border px-3 py-2"
                    }
                  >
                    <Badge variant={correct ? "default" : "outline"} className="mt-0.5 uppercase">
                      {opt.id}
                    </Badge>
                    <div className="flex-1">
                      <MathPreview value={opt.text} block={false} />
                    </div>
                    {correct ? (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                        Correct
                      </Badge>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}

          {q.correct_answer?.type === "numerical" ? (
            <div className="rounded-md border border-emerald-500/50 bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950/30">
              <strong>Numerical answer:</strong> {q.correct_answer.value}
              {q.correct_answer.tolerance != null ? (
                <span className="text-muted-foreground"> (± {q.correct_answer.tolerance})</span>
              ) : null}
            </div>
          ) : null}

          {q.correct_answer?.type === "subjective" ? (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Reference answer
              </div>
              <MathPreview value={q.correct_answer.value} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Separator />

      <SolutionsManager questionId={q.id} solutions={solutions} />
    </div>
  )
}
