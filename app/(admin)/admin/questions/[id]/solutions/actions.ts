"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

type ActionResult = { ok: true } | { ok: false; error: string }

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

const stepSchema = z.object({
  step_number: z.number().int().min(1),
  text: z.string().min(1),
  explanation: z.string().optional().nullable(),
})

const SOLUTION_TYPES = [
  "standard",
  "logical",
  "elimination",
  "shortcut",
  "trap_warning",
  "pattern",
] as const

const payloadSchema = z.object({
  question_id: z.string().uuid(),
  solution_type: z.enum(SOLUTION_TYPES),
  title: z.string().trim().max(120).optional().nullable(),
  content: z.string().trim(), // empty allowed when solution_image_url provided
  solution_image_url: z.string().optional().nullable(),
  steps: z.array(stepSchema).optional().nullable(),
  time_estimate_seconds: z.number().int().min(0).optional().nullable(),
  when_to_use: z.string().optional().nullable(),
  when_not_to_use: z.string().optional().nullable(),
  prerequisites: z.string().optional().nullable(),
  difficulty_to_execute: z.number().int().min(1).max(5).optional().nullable(),
  status: z.enum(["draft", "published", "ai_generated_unverified", "flagged"]).default("published"),
})

export type SolutionInput = z.infer<typeof payloadSchema>

export async function createSolution(
  input: SolutionInput
): Promise<ActionResult> {
  const parsed = payloadSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  if (!parsed.data.solution_image_url && parsed.data.content.trim().length < 1) {
    return { ok: false, error: "Content required, or upload a solution image" }
  }
  const client = await adminClient()
  if (!client.ok) return { ok: false, error: client.error }
  const { error } = await client.supabase.from("solutions").insert({
    ...parsed.data,
    title: parsed.data.title ?? null,
    solution_image_url: parsed.data.solution_image_url ?? null,
    steps: parsed.data.steps ?? null,
    time_estimate_seconds: parsed.data.time_estimate_seconds ?? null,
    when_to_use: parsed.data.when_to_use ?? null,
    when_not_to_use: parsed.data.when_not_to_use ?? null,
    prerequisites: parsed.data.prerequisites ?? null,
    difficulty_to_execute: parsed.data.difficulty_to_execute ?? null,
    created_by: client.user.id,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/admin/questions/${parsed.data.question_id}/solutions`)
  return { ok: true }
}

export async function updateSolution(
  id: string,
  input: SolutionInput
): Promise<ActionResult> {
  const parsed = payloadSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  if (!parsed.data.solution_image_url && parsed.data.content.trim().length < 1) {
    return { ok: false, error: "Content required, or upload a solution image" }
  }
  const client = await adminClient()
  if (!client.ok) return { ok: false, error: client.error }
  const { error } = await client.supabase
    .from("solutions")
    .update({
      solution_type: parsed.data.solution_type,
      title: parsed.data.title ?? null,
      content: parsed.data.content,
      solution_image_url: parsed.data.solution_image_url ?? null,
      steps: parsed.data.steps ?? null,
      time_estimate_seconds: parsed.data.time_estimate_seconds ?? null,
      when_to_use: parsed.data.when_to_use ?? null,
      when_not_to_use: parsed.data.when_not_to_use ?? null,
      prerequisites: parsed.data.prerequisites ?? null,
      difficulty_to_execute: parsed.data.difficulty_to_execute ?? null,
      status: parsed.data.status,
    })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/admin/questions/${parsed.data.question_id}/solutions`)
  return { ok: true }
}

export async function deleteSolution(
  id: string,
  question_id: string
): Promise<ActionResult> {
  const client = await adminClient()
  if (!client.ok) return { ok: false, error: client.error }
  const { error } = await client.supabase.from("solutions").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/admin/questions/${question_id}/solutions`)
  return { ok: true }
}
