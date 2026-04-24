import { createClient } from "@/lib/supabase/server"
import { CurriculumTree } from "@/components/admin/curriculum-tree"

export const dynamic = "force-dynamic"

export default async function AdminSubjectsPage() {
  const supabase = createClient()

  const { data: subjects, error } = await supabase
    .from("subjects")
    .select(
      "*, chapters(*, topics(*))"
    )
    .order("display_order", { ascending: true })

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load curriculum: {error.message}
      </div>
    )
  }

  // Sort nested arrays by display_order for stable rendering.
  const sorted = (subjects ?? []).map((s) => ({
    ...s,
    chapters: [...(s.chapters ?? [])]
      .sort((a, b) => a.display_order - b.display_order)
      .map((c) => ({
        ...c,
        topics: [...(c.topics ?? [])].sort(
          (a, b) => a.display_order - b.display_order
        ),
      })),
  }))

  const topicCount = sorted.reduce(
    (n, s) => n + s.chapters.reduce((m, c) => m + c.topics.length, 0),
    0
  )
  const chapterCount = sorted.reduce((n, s) => n + s.chapters.length, 0)

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Curriculum</h1>
        <p className="text-sm text-muted-foreground">
          {sorted.length} subject{sorted.length === 1 ? "" : "s"} ·{" "}
          {chapterCount} chapter{chapterCount === 1 ? "" : "s"} · {topicCount}{" "}
          topic{topicCount === 1 ? "" : "s"}. Topics anchor every question and
          solution.
        </p>
      </div>

      <CurriculumTree subjects={sorted} />
    </div>
  )
}
