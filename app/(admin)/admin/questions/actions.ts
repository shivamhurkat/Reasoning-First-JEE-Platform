"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type AdminClient =
  | { ok: false; error: string }
  | {
      ok: true
      supabase: ReturnType<typeof createClient>
      user: { id: string }
    }

async function adminClient(): Promise<AdminClient> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated" }
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return { ok: false, error: "Not authorized" }
  return { ok: true, supabase, user: { id: user.id } }
}

// ---------- Schemas ----------

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string(), // empty allowed for image-based questions
})

const baseQuestionSchema = z.object({
  topic_id: z.string().uuid("Topic required"),
  question_text: z.string().trim(),
  question_image_url: z.string().optional().nullable(),
  difficulty: z.number().int().min(1).max(5),
  estimated_time_seconds: z.number().int().min(10).max(3600),
  source: z.string().trim().max(200).optional().nullable(),
  year: z.number().int().min(1950).max(2100).optional().nullable(),
  status: z.enum(["draft", "published", "archived", "flagged"]),
})

const questionSchema = z.discriminatedUnion("question_type", [
  baseQuestionSchema.extend({
    question_type: z.literal("single_correct"),
    options: z.array(optionSchema).min(4).max(6),
    correct_option_id: z.string().min(1, "Select the correct option"),
  }),
  baseQuestionSchema.extend({
    question_type: z.literal("multi_correct"),
    options: z.array(optionSchema).min(4).max(6),
    correct_option_ids: z
      .array(z.string())
      .min(1, "Mark at least one correct option"),
  }),
  baseQuestionSchema.extend({
    question_type: z.literal("numerical"),
    numerical_value: z.number(),
    numerical_tolerance: z.number().min(0).default(0.01),
  }),
  baseQuestionSchema.extend({
    question_type: z.literal("subjective"),
    subjective_answer: z.string().trim().min(1, "Provide a reference answer"),
  }),
])

export type QuestionInput = z.infer<typeof questionSchema>

// Build the DB jsonb payloads from form input.
function buildDbPayload(input: QuestionInput) {
  if (input.question_type === "single_correct") {
    return {
      options: input.options,
      correct_answer: { type: "single", value: input.correct_option_id },
    }
  }
  if (input.question_type === "multi_correct") {
    return {
      options: input.options,
      correct_answer: { type: "multi", values: input.correct_option_ids },
    }
  }
  if (input.question_type === "numerical") {
    return {
      options: null,
      correct_answer: {
        type: "numerical",
        value: input.numerical_value,
        tolerance: input.numerical_tolerance,
      },
    }
  }
  return {
    options: null,
    correct_answer: { type: "subjective", value: input.subjective_answer },
  }
}

// ---------- Mutations ----------

export async function createQuestion(
  input: QuestionInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = questionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  if (!parsed.data.question_image_url && parsed.data.question_text.trim().length < 10) {
    return { ok: false, error: "Question must have at least 10 characters of text, or include an image" }
  }
  const client = await adminClient()
  if (!client.ok) return { ok: false, error: client.error }

  const { options, correct_answer } = buildDbPayload(parsed.data)

  const { data, error } = await client.supabase
    .from("questions")
    .insert({
      topic_id: parsed.data.topic_id,
      question_text: parsed.data.question_text,
      question_image_url: parsed.data.question_image_url ?? null,
      question_type: parsed.data.question_type,
      options,
      correct_answer,
      difficulty: parsed.data.difficulty,
      estimated_time_seconds: parsed.data.estimated_time_seconds,
      source: parsed.data.source || null,
      year: parsed.data.year ?? null,
      status: parsed.data.status,
      created_by: client.user.id,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed" }
  }
  revalidatePath("/admin/questions")
  return { ok: true, data: { id: data.id } }
}

export async function updateQuestion(
  id: string,
  input: QuestionInput
): Promise<ActionResult> {
  const parsed = questionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  if (!parsed.data.question_image_url && parsed.data.question_text.trim().length < 10) {
    return { ok: false, error: "Question must have at least 10 characters of text, or include an image" }
  }
  const client = await adminClient()
  if (!client.ok) return { ok: false, error: client.error }

  const { options, correct_answer } = buildDbPayload(parsed.data)

  const { error } = await client.supabase
    .from("questions")
    .update({
      topic_id: parsed.data.topic_id,
      question_text: parsed.data.question_text,
      question_image_url: parsed.data.question_image_url ?? null,
      question_type: parsed.data.question_type,
      options,
      correct_answer,
      difficulty: parsed.data.difficulty,
      estimated_time_seconds: parsed.data.estimated_time_seconds,
      source: parsed.data.source || null,
      year: parsed.data.year ?? null,
      status: parsed.data.status,
    })
    .eq("id", id)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/questions")
  revalidatePath(`/admin/questions/${id}/edit`)
  revalidatePath(`/admin/questions/${id}/solutions`)
  return { ok: true, data: null }
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  const client = await adminClient()
  if (!client.ok) return { ok: false, error: client.error }
  const { error } = await client.supabase.from("questions").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/questions")
  return { ok: true, data: null }
}

export async function duplicateQuestion(id: string): Promise<ActionResult<{ id: string }>> {
  const client = await adminClient()
  if (!client.ok) return { ok: false, error: client.error }
  const { data: orig, error } = await client.supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .single()
  if (error || !orig) return { ok: false, error: error?.message ?? "Not found" }
  const { id: _id, created_at, updated_at, ...rest } = orig
  void _id
  void created_at
  void updated_at
  const { data, error: insErr } = await client.supabase
    .from("questions")
    .insert({
      ...rest,
      question_text: `[Copy] ${rest.question_text}`,
      status: "draft",
      created_by: client.user.id,
    })
    .select("id")
    .single()
  if (insErr || !data) {
    return { ok: false, error: insErr?.message ?? "Duplicate failed" }
  }
  revalidatePath("/admin/questions")
  return { ok: true, data: { id: data.id } }
}

export async function bulkUpdateStatus(
  ids: string[],
  status: "draft" | "published" | "archived" | "flagged"
): Promise<ActionResult<{ count: number }>> {
  if (ids.length === 0) return { ok: true, data: { count: 0 } }
  const client = await adminClient()
  if (!client.ok) return { ok: false, error: client.error }
  const { error, count } = await client.supabase
    .from("questions")
    .update({ status }, { count: "exact" })
    .in("id", ids)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/questions")
  return { ok: true, data: { count: count ?? ids.length } }
}

export async function bulkDelete(
  ids: string[]
): Promise<ActionResult<{ count: number }>> {
  if (ids.length === 0) return { ok: true, data: { count: 0 } }
  const client = await adminClient()
  if (!client.ok) return { ok: false, error: client.error }
  const { error, count } = await client.supabase
    .from("questions")
    .delete({ count: "exact" })
    .in("id", ids)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/questions")
  return { ok: true, data: { count: count ?? ids.length } }
}

// Redirect helpers usable directly from the form.
export async function createAndGoToSolutions(input: QuestionInput) {
  const res = await createQuestion(input)
  if (!res.ok) return res
  redirect(`/admin/questions/${res.data.id}/solutions`)
}
