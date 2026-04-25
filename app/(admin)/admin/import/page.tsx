import { createClient } from "@/lib/supabase/server"
import { ImportClient } from "./import-client"

export const dynamic = "force-dynamic"

export default async function ImportPage() {
  const supabase = createClient()

  const [subjectsRes, chaptersRes, topicsRes] = await Promise.all([
    supabase.from("subjects").select("id, name").order("display_order"),
    supabase.from("chapters").select("id, name, subject_id").order("display_order"),
    supabase
      .from("topics")
      .select("id, name, chapter_id, chapters(name, subjects(name))")
      .order("display_order"),
  ])

  const subjects = subjectsRes.data ?? []
  const chapters = chaptersRes.data ?? []
  const rawTopics = topicsRes.data ?? []

  // Build a set of known "subject|chapter|topic" keys for client-side CSV validation
  const knownTopicNames = new Set<string>()
  for (const t of rawTopics) {
    const row = t as unknown as {
      id: string
      name: string
      chapter_id: string
      chapters: { name: string; subjects: { name: string } | null } | null
    }
    const key = [
      row.chapters?.subjects?.name?.toLowerCase().trim(),
      row.chapters?.name?.toLowerCase().trim(),
      row.name?.toLowerCase().trim(),
    ].join("|")
    knownTopicNames.add(key)
  }

  const topics = rawTopics.map((t) => ({
    id: (t as { id: string }).id,
    name: (t as { name: string }).name,
    chapter_id: (t as { chapter_id: string }).chapter_id,
  }))

  return (
    <ImportClient
      subjects={subjects}
      chapters={chapters}
      topics={topics}
      knownTopicNames={Array.from(knownTopicNames)}
    />
  )
}
