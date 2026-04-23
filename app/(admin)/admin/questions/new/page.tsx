import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { QuestionForm } from "@/components/admin/question-form"

export const dynamic = "force-dynamic"

export default async function NewQuestionPage() {
  const supabase = createClient()

  const [subjectsRes, chaptersRes, topicsRes] = await Promise.all([
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

  const taxonomyMissing =
    (subjectsRes.data ?? []).length === 0 ||
    (chaptersRes.data ?? []).length === 0 ||
    (topicsRes.data ?? []).length === 0

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/admin/questions"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back to questions
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New question</h1>
        <p className="text-sm text-muted-foreground">
          Draft a question. You&apos;ll add solutions on the next screen.
        </p>
      </div>

      {taxonomyMissing ? (
        <div className="rounded-md border border-dashed p-6 text-sm">
          Curriculum is empty or incomplete. Go to{" "}
          <Link
            href="/admin/subjects"
            className="font-medium underline underline-offset-4"
          >
            /admin/subjects
          </Link>{" "}
          and seed the JEE curriculum first.
        </div>
      ) : (
        <QuestionForm
          mode="create"
          subjects={subjectsRes.data ?? []}
          chapters={chaptersRes.data ?? []}
          topics={topicsRes.data ?? []}
        />
      )}
    </div>
  )
}
