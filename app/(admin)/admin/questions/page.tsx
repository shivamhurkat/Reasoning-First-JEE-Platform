import Link from "next/link"
import { Plus } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QuestionsFilterBar } from "@/components/admin/questions-filter-bar"
import { QuestionsTable, type QuestionRow } from "@/components/admin/questions-table"

export const dynamic = "force-dynamic"

type SearchParams = {
  subject?: string
  chapter?: string
  topic?: string
  difficulty?: string
  status?: string
  search?: string
  page?: string
  pageSize?: string
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()

  const page = Math.max(1, Number(searchParams.page ?? "1") || 1)
  const pageSize = Math.min(
    100,
    Math.max(5, Number(searchParams.pageSize ?? "25") || 25)
  )
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Load taxonomy (needed for the filter bar AND to resolve topic→chapter→subject).
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

  const subjects = subjectsRes.data ?? []
  const chapters = chaptersRes.data ?? []
  const topics = topicsRes.data ?? []

  // Resolve filter → topic id list
  let topicIdFilter: string[] | null = null
  if (searchParams.topic) {
    topicIdFilter = [searchParams.topic]
  } else if (searchParams.chapter) {
    topicIdFilter = topics
      .filter((t) => t.chapter_id === searchParams.chapter)
      .map((t) => t.id)
    if (topicIdFilter.length === 0) topicIdFilter = ["00000000-0000-0000-0000-000000000000"]
  } else if (searchParams.subject) {
    const chapterIds = chapters
      .filter((c) => c.subject_id === searchParams.subject)
      .map((c) => c.id)
    topicIdFilter = topics
      .filter((t) => chapterIds.includes(t.chapter_id))
      .map((t) => t.id)
    if (topicIdFilter.length === 0) topicIdFilter = ["00000000-0000-0000-0000-000000000000"]
  }

  // Main paginated query
  let query = supabase
    .from("questions")
    .select(
      `id, question_text, question_type, difficulty, status, source, created_at, topic_id,
       topics(id, name, chapter_id, chapters(id, name, subject_id, subjects(id, name))),
       solutions(id)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to)

  if (topicIdFilter) query = query.in("topic_id", topicIdFilter)
  if (searchParams.difficulty)
    query = query.eq("difficulty", Number(searchParams.difficulty))
  if (searchParams.status) query = query.eq("status", searchParams.status)
  if (searchParams.search)
    query = query.ilike("question_text", `%${searchParams.search}%`)

  const { data: questions, error, count } = await query

  // Info cards: status counts (ignoring filters — these are platform-wide)
  const statusCountsP = Promise.all(
    (["draft", "published", "flagged"] as const).map(async (s) => {
      const { count: c } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("status", s)
      return [s, c ?? 0] as const
    })
  )
  const statusCounts = Object.fromEntries(await statusCountsP) as Record<
    "draft" | "published" | "flagged",
    number
  >

  const rows: QuestionRow[] = (questions ?? []).map((q) => {
    const t = (q as { topics?: { name: string; chapters?: { name: string; subjects?: { name: string } | null } | null } | null }).topics
    const chapter = t?.chapters
    const subject = chapter?.subjects
    return {
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type as QuestionRow["question_type"],
      difficulty: q.difficulty,
      status: q.status as QuestionRow["status"],
      source: q.source,
      created_at: q.created_at,
      subject_name: subject?.name ?? "—",
      chapter_name: chapter?.name ?? "—",
      topic_name: t?.name ?? "—",
      solutions_count: (q as { solutions?: unknown[] }).solutions?.length ?? 0,
    }
  })

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Questions</h1>
          <p className="text-sm text-muted-foreground">
            {total} total · filter, triage, and publish.
          </p>
        </div>
        <Button render={<Link href="/admin/questions/new" />}>
          <Plus /> New question
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatusCard
          label="Draft"
          value={statusCounts.draft}
          tone="muted"
          href="/admin/questions?status=draft"
        />
        <StatusCard
          label="Published"
          value={statusCounts.published}
          tone="primary"
          href="/admin/questions?status=published"
        />
        <StatusCard
          label="Flagged"
          value={statusCounts.flagged}
          tone="destructive"
          href="/admin/questions?status=flagged"
        />
      </div>

      <QuestionsFilterBar
        subjects={subjects}
        chapters={chapters}
        topics={topics}
      />

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load questions: {error.message}
        </div>
      ) : (
        <QuestionsTable
          rows={rows}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
        />
      )}
    </div>
  )
}

function StatusCard({
  label,
  value,
  tone,
  href,
}: {
  label: string
  value: number
  tone: "muted" | "primary" | "destructive"
  href: string
}) {
  const toneClass =
    tone === "primary"
      ? "text-emerald-600"
      : tone === "destructive"
        ? "text-destructive"
        : "text-muted-foreground"
  return (
    <Link href={href}>
      <Card className="transition-all hover:border-primary/40 hover:shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
