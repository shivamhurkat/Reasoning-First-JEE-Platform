"use server"

import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/types/database.types"

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string }

async function adminCheck() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return null
  return { supabase, user }
}

export type ParsedRow = {
  subject: string
  chapter: string
  topic: string
  question_type: string
  question_text: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct_answer: string
  difficulty: number
  source?: string
  year?: number
  standard_solution?: string
  shortcut_solution?: string
}

export type ImportCSVResult = {
  inserted: number
  skipped: number
  errors: string[]
}

export async function importQuestionsFromCSV(
  rows: ParsedRow[],
  publishImmediately = true
): Promise<Result<ImportCSVResult>> {
  try {
    const ctx = await adminCheck()
    if (!ctx) return { ok: false, error: "Not authorized" }
    const { supabase } = ctx

    // Build a lookup map: "subject|chapter|topic" → topic_id
    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("id, name, chapters(name, subjects(name))")

    if (topicsError) {
      return { ok: false, error: `Failed to load topics: ${topicsError.message}` }
    }

    const topicMap = new Map<string, string>()
    for (const t of topics ?? []) {
      const row = t as unknown as {
        id: string
        name: string
        chapters: { name: string; subjects: { name: string } | null } | null
      }
      const key = [
        row.chapters?.subjects?.name?.toLowerCase().trim(),
        row.chapters?.name?.toLowerCase().trim(),
        row.name?.toLowerCase().trim(),
      ].join("|")
      topicMap.set(key, row.id)
    }

    if (topicMap.size === 0) {
      return {
        ok: false,
        error:
          "No topics found in database. Run the curriculum seeding action first (Admin → Seed JEE Curriculum).",
      }
    }

    let inserted = 0
    let skipped = 0
    const errors: string[] = []

    const validTypes = ["single_correct", "multi_correct", "numerical", "subjective"]

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1

      if (!validTypes.includes(row.question_type)) {
        skipped++
        errors.push(`Row ${rowNum}: invalid question_type "${row.question_type}"`)
        continue
      }

      const key = [
        row.subject.toLowerCase().trim(),
        row.chapter.toLowerCase().trim(),
        row.topic.toLowerCase().trim(),
      ].join("|")
      const topicId = topicMap.get(key)
      if (!topicId) {
        skipped++
        errors.push(
          `Row ${rowNum}: topic not found — subject="${row.subject}", chapter="${row.chapter}", topic="${row.topic}" (key: ${key})`
        )
        continue
      }

      let options: Json = null
      let correct_answer: Json

      if (row.question_type === "single_correct" || row.question_type === "multi_correct") {
        options = [
          { id: "a", text: row.option_a ?? "" },
          { id: "b", text: row.option_b ?? "" },
          { id: "c", text: row.option_c ?? "" },
          { id: "d", text: row.option_d ?? "" },
        ].filter((o) => (o.text as string).trim().length > 0)

        if (row.question_type === "single_correct") {
          correct_answer = { type: "single", value: row.correct_answer.toLowerCase().trim() }
        } else {
          correct_answer = {
            type: "multi",
            values: row.correct_answer
              .split(",")
              .map((v) => v.trim().toLowerCase())
              .filter(Boolean),
          }
        }
      } else if (row.question_type === "numerical") {
        const num = parseFloat(row.correct_answer)
        if (isNaN(num)) {
          skipped++
          errors.push(`Row ${rowNum}: correct_answer must be a number for numerical type`)
          continue
        }
        correct_answer = { type: "numerical", value: num, tolerance: 0.01 }
      } else {
        correct_answer = { type: "subjective", value: row.correct_answer }
      }

      const { data: question, error } = await supabase
        .from("questions")
        .insert({
          topic_id: topicId,
          question_text: row.question_text,
          question_type: row.question_type,
          options,
          correct_answer,
          difficulty: row.difficulty,
          source: row.source || null,
          year: row.year || null,
          status: publishImmediately ? "published" : "draft",
        })
        .select("id")
        .single()

      if (error) {
        skipped++
        errors.push(`Row ${rowNum}: insert failed — ${error.message}`)
        continue
      }

      inserted++

      const solutionsToInsert: {
        question_id: string
        solution_type: string
        content: string
        status: string
        created_by: string
      }[] = []

      if (row.standard_solution?.trim()) {
        solutionsToInsert.push({
          question_id: question.id,
          solution_type: "standard",
          content: row.standard_solution.trim(),
          status: "published",
          created_by: ctx.user.id,
        })
      }
      if (row.shortcut_solution?.trim()) {
        solutionsToInsert.push({
          question_id: question.id,
          solution_type: "shortcut",
          content: row.shortcut_solution.trim(),
          status: "published",
          created_by: ctx.user.id,
        })
      }
      if (solutionsToInsert.length > 0) {
        const { error: solErr } = await supabase.from("solutions").insert(solutionsToInsert)
        if (solErr) {
          errors.push(
            `Row ${rowNum}: question inserted but solutions failed — ${solErr.message}`
          )
        }
      }
    }

    return { ok: true, data: { inserted, skipped, errors } }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Unexpected server error: ${message}` }
  }
}

export type ImageImportMetadata = {
  topicId: string
  questionType: string
  optionCount: number
}

export async function importQuestionsFromImages(
  imageUrls: string[],
  metadata: ImageImportMetadata
): Promise<Result<{ inserted: number }>> {
  const ctx = await adminCheck()
  if (!ctx) return { ok: false, error: "Not authorized" }
  const { supabase } = ctx

  const optionLetters = ["a", "b", "c", "d", "e", "f"].slice(0, metadata.optionCount)
  const options =
    metadata.questionType === "numerical" || metadata.questionType === "subjective"
      ? null
      : optionLetters.map((l) => ({ id: l, text: "" }))

  let correct_answer: Json
  if (metadata.questionType === "single_correct") {
    correct_answer = { type: "single", value: "a" }
  } else if (metadata.questionType === "multi_correct") {
    correct_answer = { type: "multi", values: ["a"] }
  } else if (metadata.questionType === "numerical") {
    correct_answer = { type: "numerical", value: 0, tolerance: 0.01 }
  } else {
    correct_answer = { type: "subjective", value: "" }
  }

  let inserted = 0
  for (const imageUrl of imageUrls) {
    const { error } = await supabase.from("questions").insert({
      topic_id: metadata.topicId,
      question_text: "",
      question_image_url: imageUrl,
      question_type: metadata.questionType,
      options,
      correct_answer,
      difficulty: 3,
      status: "draft",
    })
    if (!error) inserted++
  }

  return { ok: true, data: { inserted } }
}
