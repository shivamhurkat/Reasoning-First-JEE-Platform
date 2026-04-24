import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { QuestionForm } from "@/components/admin/question-form"
import { DeleteQuestionButton } from "@/components/admin/delete-question-button"
import { Separator } from "@/components/ui/separator"

export const dynamic = "force-dynamic"

export default async function EditQuestionPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [questionRes, subjectsRes, chaptersRes, topicsRes] = await Promise.all([
    supabase
      .from("questions")
      .select("*, topics(id, chapter_id, chapters(id, subject_id))")
      .eq("id", params.id)
      .single(),
    supabase
      .from("subjects")
      .select("id, name")
      .order("display_order", { ascending: true }),
    supabase
      .from("chapters")
      .select("id, name, subject_id")
      .order("display_order", { ascending: true }),
    supabase
      .from("topics")
      .select("id, name, chapter_id")
      .order("display_order", { ascending: true }),
  ])

  if (questionRes.error || !questionRes.data) {
    notFound()
  }

  const q = questionRes.data as unknown as {
    id: string
    topic_id: string
    question_text: string
    question_image_url: string | null
    question_type:
      | "single_correct"
      | "multi_correct"
      | "numerical"
      | "subjective"
    options: { id: string; text: string }[] | null
    correct_answer: Record<string, unknown> | null
    difficulty: number
    estimated_time_seconds: number
    source: string | null
    year: number | null
    status: "draft" | "published" | "archived" | "flagged"
    topics: {
      id: string
      chapter_id: string
      chapters: { id: string; subject_id: string } | null
    } | null
  }

  const chapterId = q.topics?.chapter_id ?? null
  const subjectId = q.topics?.chapters?.subject_id ?? null

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/admin/questions"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back to questions
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Edit question</h1>
      </div>

      <QuestionForm
        mode="edit"
        subjects={subjectsRes.data ?? []}
        chapters={chaptersRes.data ?? []}
        topics={topicsRes.data ?? []}
        initial={{
          id: q.id,
          subject_id: subjectId,
          chapter_id: chapterId,
          topic_id: q.topic_id,
          question_text: q.question_text,
          question_image_url: q.question_image_url,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          difficulty: q.difficulty,
          estimated_time_seconds: q.estimated_time_seconds,
          source: q.source,
          year: q.year,
          status: q.status,
        }}
      />

      <Separator />

      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <h3 className="font-medium text-destructive">Danger zone</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting this question also removes all of its solutions and every
          student attempt tied to it.
        </p>
        <div className="mt-3">
          <DeleteQuestionButton id={q.id} />
        </div>
      </div>
    </div>
  )
}
