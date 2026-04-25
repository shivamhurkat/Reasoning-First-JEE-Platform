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
}

export type ImportCSVResult = {
  inserted: number
  skipped: number
  errors: string[]
}

export async function importQuestionsFromCSV(
  rows: ParsedRow[]
): Promise<Result<ImportCSVResult>> {
  const ctx = await adminCheck()
  if (!ctx) return { ok: false, error: "Not authorized" }
  const { supabase } = ctx

  // Build a lookup map: "subject|chapter|topic" → topic_id
  const { data: topics } = await supabase
    .from("topics")
    .select("id, name, chapters(name, subjects(name))")

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
        `Row ${rowNum}: topic "${row.topic}" not found in "${row.chapter}" / "${row.subject}"`
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

    const { error } = await supabase.from("questions").insert({
      topic_id: topicId,
      question_text: row.question_text,
      question_type: row.question_type,
      options,
      correct_answer,
      difficulty: row.difficulty,
      source: row.source || null,
      year: row.year || null,
      status: "draft",
    })

    if (error) {
      skipped++
      errors.push(`Row ${rowNum}: ${error.message}`)
    } else {
      inserted++
    }
  }

  return { ok: true, data: { inserted, skipped, errors } }
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
