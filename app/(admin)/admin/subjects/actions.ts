"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/utils/slug"
import { JEE_CURRICULUM } from "@/lib/constants/jee-curriculum"

type ActionResult = { ok: true } | { ok: false; error: string }

async function assertAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, error: "Not authenticated" as const }
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") {
    return { supabase, error: "Not authorized" as const }
  }
  return { supabase, user, error: null }
}

// ---------- Subject ----------

const subjectSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80),
  exam: z.enum(["jee_mains", "jee_advanced", "neet"]),
  display_order: z.number().int().min(0).default(0),
})

export async function createSubject(
  input: z.infer<typeof subjectSchema>
): Promise<ActionResult> {
  const { supabase, error } = await assertAdmin()
  if (error) return { ok: false, error }
  const parsed = subjectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.message }

  const { error: dbErr } = await supabase.from("subjects").insert({
    name: parsed.data.name,
    slug: parsed.data.slug || slugify(parsed.data.name),
    exam: parsed.data.exam,
    display_order: parsed.data.display_order,
  })
  if (dbErr) return { ok: false, error: dbErr.message }
  revalidatePath("/admin/subjects")
  return { ok: true }
}

export async function updateSubject(
  id: string,
  input: Partial<z.infer<typeof subjectSchema>>
): Promise<ActionResult> {
  const { supabase, error } = await assertAdmin()
  if (error) return { ok: false, error }
  const { error: dbErr } = await supabase.from("subjects").update(input).eq("id", id)
  if (dbErr) return { ok: false, error: dbErr.message }
  revalidatePath("/admin/subjects")
  return { ok: true }
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  const { supabase, error } = await assertAdmin()
  if (error) return { ok: false, error }
  const { error: dbErr } = await supabase.from("subjects").delete().eq("id", id)
  if (dbErr) return { ok: false, error: dbErr.message }
  revalidatePath("/admin/subjects")
  return { ok: true }
}

// ---------- Chapter ----------

const chapterSchema = z.object({
  subject_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  display_order: z.number().int().min(0).default(0),
  weightage_percent: z.number().min(0).max(100).nullable().optional(),
})

export async function createChapter(
  input: z.infer<typeof chapterSchema>
): Promise<ActionResult> {
  const { supabase, error } = await assertAdmin()
  if (error) return { ok: false, error }
  const parsed = chapterSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.message }

  const { error: dbErr } = await supabase.from("chapters").insert({
    subject_id: parsed.data.subject_id,
    name: parsed.data.name,
    slug: parsed.data.slug || slugify(parsed.data.name),
    display_order: parsed.data.display_order,
    weightage_percent: parsed.data.weightage_percent ?? null,
  })
  if (dbErr) return { ok: false, error: dbErr.message }
  revalidatePath("/admin/subjects")
  return { ok: true }
}

export async function updateChapter(
  id: string,
  input: Partial<z.infer<typeof chapterSchema>>
): Promise<ActionResult> {
  const { supabase, error } = await assertAdmin()
  if (error) return { ok: false, error }
  const { error: dbErr } = await supabase.from("chapters").update(input).eq("id", id)
  if (dbErr) return { ok: false, error: dbErr.message }
  revalidatePath("/admin/subjects")
  return { ok: true }
}

export async function deleteChapter(id: string): Promise<ActionResult> {
  const { supabase, error } = await assertAdmin()
  if (error) return { ok: false, error }
  const { error: dbErr } = await supabase.from("chapters").delete().eq("id", id)
  if (dbErr) return { ok: false, error: dbErr.message }
  revalidatePath("/admin/subjects")
  return { ok: true }
}

// ---------- Topic ----------

const topicSchema = z.object({
  chapter_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  display_order: z.number().int().min(0).default(0),
})

export async function createTopic(
  input: z.infer<typeof topicSchema>
): Promise<ActionResult> {
  const { supabase, error } = await assertAdmin()
  if (error) return { ok: false, error }
  const parsed = topicSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.message }

  const { error: dbErr } = await supabase.from("topics").insert({
    chapter_id: parsed.data.chapter_id,
    name: parsed.data.name,
    slug: parsed.data.slug || slugify(parsed.data.name),
    display_order: parsed.data.display_order,
  })
  if (dbErr) return { ok: false, error: dbErr.message }
  revalidatePath("/admin/subjects")
  return { ok: true }
}

export async function updateTopic(
  id: string,
  input: Partial<z.infer<typeof topicSchema>>
): Promise<ActionResult> {
  const { supabase, error } = await assertAdmin()
  if (error) return { ok: false, error }
  const { error: dbErr } = await supabase.from("topics").update(input).eq("id", id)
  if (dbErr) return { ok: false, error: dbErr.message }
  revalidatePath("/admin/subjects")
  return { ok: true }
}

export async function deleteTopic(id: string): Promise<ActionResult> {
  const { supabase, error } = await assertAdmin()
  if (error) return { ok: false, error }
  const { error: dbErr } = await supabase.from("topics").delete().eq("id", id)
  if (dbErr) return { ok: false, error: dbErr.message }
  revalidatePath("/admin/subjects")
  return { ok: true }
}

// ---------- Seed ----------

export async function seedCurriculum(): Promise<
  ActionResult & { inserted?: { subjects: number; chapters: number; topics: number } }
> {
  const { supabase, error } = await assertAdmin()
  if (error) return { ok: false, error }

  // Refuse to run if there's anything already. Keeps the button safe.
  const { count: subjectCount, error: countErr } = await supabase
    .from("subjects")
    .select("*", { count: "exact", head: true })
  if (countErr) return { ok: false, error: countErr.message }
  if ((subjectCount ?? 0) > 0) {
    return {
      ok: false,
      error: "Curriculum already has data — seed only runs on an empty tree.",
    }
  }

  let nSub = 0
  let nCh = 0
  let nTp = 0

  for (let si = 0; si < JEE_CURRICULUM.length; si++) {
    const subj = JEE_CURRICULUM[si]
    const { data: subjectRow, error: subjErr } = await supabase
      .from("subjects")
      .insert({
        name: subj.name,
        slug: slugify(subj.name),
        exam: subj.exam,
        display_order: si,
      })
      .select("id")
      .single()
    if (subjErr || !subjectRow) {
      return { ok: false, error: subjErr?.message ?? "Subject insert failed" }
    }
    nSub++

    for (let ci = 0; ci < subj.chapters.length; ci++) {
      const ch = subj.chapters[ci]
      const { data: chapterRow, error: chErr } = await supabase
        .from("chapters")
        .insert({
          subject_id: subjectRow.id,
          name: ch.name,
          slug: slugify(ch.name),
          display_order: ci,
          weightage_percent: null,
        })
        .select("id")
        .single()
      if (chErr || !chapterRow) {
        return { ok: false, error: chErr?.message ?? "Chapter insert failed" }
      }
      nCh++

      if (ch.topics.length > 0) {
        const topicRows = ch.topics.map((t, ti) => ({
          chapter_id: chapterRow.id,
          name: t.name,
          slug: slugify(t.name),
          display_order: ti,
        }))
        const { error: tErr } = await supabase.from("topics").insert(topicRows)
        if (tErr) return { ok: false, error: tErr.message }
        nTp += topicRows.length
      }
    }
  }

  revalidatePath("/admin/subjects")
  return { ok: true, inserted: { subjects: nSub, chapters: nCh, topics: nTp } }
}
