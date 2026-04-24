"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  pickQuestionForSession,
  getQuestionWithSolutions,
  type QuestionData,
  type SolutionData,
} from "@/lib/queries/practice"
import type { ApproachId } from "@/lib/constants/practice"

// ---------- helpers ----------

type AuthedClient =
  | { ok: true; supabase: ReturnType<typeof createClient>; userId: string }
  | { ok: false; error: string }

async function authed(): Promise<AuthedClient> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated" }
  return { ok: true, supabase, userId: user.id }
}

// Pull the chapter/subject ids that belong *above* a given scope so the
// session row carries full context (useful later for analytics).
async function expandScope(
  supabase: ReturnType<typeof createClient>,
  scope: "topic" | "chapter" | "subject" | "mixed",
  scopeId: string | undefined
): Promise<{
  topic_id: string | null
  chapter_id: string | null
  subject_id: string | null
}> {
  if (scope === "topic" && scopeId) {
    const { data } = await supabase
      .from("topics")
      .select("id, chapter_id, chapters(subject_id)")
      .eq("id", scopeId)
      .maybeSingle()
    const chapter_id = (data as unknown as { chapter_id?: string })
      ?.chapter_id ?? null
    const subject_id =
      (data as unknown as { chapters?: { subject_id?: string } })?.chapters
        ?.subject_id ?? null
    return { topic_id: scopeId, chapter_id, subject_id }
  }
  if (scope === "chapter" && scopeId) {
    const { data } = await supabase
      .from("chapters")
      .select("subject_id")
      .eq("id", scopeId)
      .maybeSingle()
    return {
      topic_id: null,
      chapter_id: scopeId,
      subject_id: data?.subject_id ?? null,
    }
  }
  if (scope === "subject" && scopeId) {
    return { topic_id: null, chapter_id: null, subject_id: scopeId }
  }
  return { topic_id: null, chapter_id: null, subject_id: null }
}

// ---------- startSession ----------

export type StartSessionInput = {
  scope: "topic" | "chapter" | "subject" | "mixed"
  scopeId?: string
}

// Starts (or resumes) a practice session then redirects to it.
// Designed to be invoked from a form's `action` prop.
export async function startSession(formData: FormData): Promise<void> {
  const scope = formData.get("scope") as StartSessionInput["scope"]
  const scopeId = (formData.get("scopeId") as string | null) || undefined

  const auth = await authed()
  if (!auth.ok) redirect("/login")
  const { supabase, userId } = auth

  // Resume active session if one exists.
  const { data: active } = await supabase
    .from("practice_sessions")
    .select("id")
    .eq("user_id", userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (active?.id) {
    redirect(`/practice/session/${active.id}`)
  }

  // For topic scope, refuse empty pools early so users get a toast on the
  // client instead of landing on an "exhausted" session.
  if (scope === "topic" && scopeId) {
    const { count } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("topic_id", scopeId)
      .eq("status", "published")
    if ((count ?? 0) === 0) {
      redirect(`/practice?error=empty_topic`)
    }
  }

  const scopeIds = await expandScope(supabase, scope, scopeId)

  const { data: created, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: userId,
      session_type: "free_practice",
      topic_id: scopeIds.topic_id,
      chapter_id: scopeIds.chapter_id,
      subject_id: scopeIds.subject_id,
    })
    .select("id")
    .single()

  if (error || !created) {
    redirect(`/practice?error=session_failed`)
  }

  redirect(`/practice/session/${created.id}`)
}

// ---------- submitAttempt ----------

export type SubmitAttemptInput = {
  sessionId: string
  questionId: string
  approach: ApproachId
  answer: unknown
  isCorrect: boolean | null
  timeTakenSeconds: number
  approachChosenAt: string | null // ISO
  hintUsed?: boolean
  coachUsed?: boolean
}

export async function submitAttempt(
  input: SubmitAttemptInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await authed()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, userId } = auth

  // Confirm the session belongs to this user (defense-in-depth — RLS also
  // blocks inserts referencing someone else's session).
  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, user_id, ended_at")
    .eq("id", input.sessionId)
    .maybeSingle()
  if (!session || session.user_id !== userId) {
    return { ok: false, error: "Session not found" }
  }
  if (session.ended_at) {
    return { ok: false, error: "Session already ended" }
  }

  // submitted_answer is jsonb; our AnswerInput union is Json-compatible but
  // the generated types require a broader cast.
  const attemptInsert = {
    session_id: input.sessionId,
    user_id: userId,
    question_id: input.questionId,
    chosen_approach: input.approach,
    approach_chosen_at: input.approachChosenAt,
    submitted_answer: JSON.parse(JSON.stringify(input.answer ?? null)),
    is_correct: input.isCorrect,
    time_taken_seconds: Math.max(0, Math.round(input.timeTakenSeconds)),
    hint_used: Boolean(input.hintUsed),
    coach_used: Boolean(input.coachUsed),
  }
  const { error } = await supabase
    .from("practice_attempts")
    .insert(attemptInsert)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// ---------- getNextQuestion (for in-session "Next" button) ----------

export async function getNextQuestion(sessionId: string): Promise<
  | {
      ok: true
      question: QuestionData
      solutions: SolutionData[]
      exhausted: false
    }
  | { ok: true; exhausted: true; question: null; solutions: null }
  | { ok: false; error: string }
> {
  const auth = await authed()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, userId } = auth

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, user_id, ended_at, topic_id, chapter_id, subject_id")
    .eq("id", sessionId)
    .maybeSingle()
  if (!session || session.user_id !== userId) {
    return { ok: false, error: "Session not found" }
  }
  if (session.ended_at) return { ok: false, error: "Session already ended" }

  const pick = await pickQuestionForSession(
    sessionId,
    {
      topic_id: session.topic_id,
      chapter_id: session.chapter_id,
      subject_id: session.subject_id,
    },
    userId
  )

  if (!pick.question) {
    return {
      ok: true,
      exhausted: true,
      question: null,
      solutions: null,
    }
  }

  const full = await getQuestionWithSolutions(pick.question.id)
  if (!full) return { ok: false, error: "Failed to load question" }

  return {
    ok: true,
    exhausted: false,
    question: full.question,
    solutions: full.solutions,
  }
}

// ---------- endSession ----------

type EndSessionResult =
  | { ok: true; xpEarned: number; streak: number }
  | { ok: false; error: string }

function computeXp(attempts: {
  is_correct: boolean | null
  chosen_approach: string | null
}[]): number {
  let xp = 0
  for (const a of attempts) {
    xp += 2 // attempted
    if (a.is_correct) {
      xp += 10
      if (a.chosen_approach && a.chosen_approach !== "full_solve") {
        xp += 5
      }
    }
  }
  return xp
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function endSession(sessionId: string): Promise<EndSessionResult> {
  const auth = await authed()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, userId } = auth

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, user_id, ended_at, started_at")
    .eq("id", sessionId)
    .maybeSingle()

  if (!session || session.user_id !== userId) {
    return { ok: false, error: "Session not found" }
  }

  // Idempotent: if already ended, just return a recomputed summary.
  const { data: attempts } = await supabase
    .from("practice_attempts")
    .select("is_correct, chosen_approach, time_taken_seconds")
    .eq("session_id", sessionId)

  const rows = attempts ?? []
  const total = rows.length
  const correct = rows.filter((r) => r.is_correct === true).length
  const totalTime = rows.reduce(
    (sum, r) => sum + (r.time_taken_seconds ?? 0),
    0
  )
  const xpEarned = computeXp(rows)

  if (!session.ended_at) {
    await supabase
      .from("practice_sessions")
      .update({
        ended_at: new Date().toISOString(),
        total_questions: total,
        correct_count: correct,
        total_time_seconds: totalTime,
        xp_earned: xpEarned,
      })
      .eq("id", sessionId)
  }

  // XP + streak on profile.
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("xp_total, current_streak, longest_streak, last_active_date")
    .eq("id", userId)
    .maybeSingle()

  const today = new Date()
  const todayStr = ymd(today)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = ymd(yesterday)

  let nextStreak = profile?.current_streak ?? 0
  if (profile) {
    if (profile.last_active_date !== todayStr) {
      if (profile.last_active_date === yesterdayStr) {
        nextStreak = (profile.current_streak ?? 0) + 1
      } else {
        nextStreak = 1
      }
    }
  } else {
    nextStreak = 1
  }
  const nextLongest = Math.max(profile?.longest_streak ?? 0, nextStreak)

  // Only add XP if we just ended the session (avoid double-counting when
  // endSession is called twice).
  if (!session.ended_at && profile) {
    await supabase
      .from("user_profiles")
      .update({
        xp_total: (profile.xp_total ?? 0) + xpEarned,
        current_streak: nextStreak,
        longest_streak: nextLongest,
        last_active_date: todayStr,
      })
      .eq("id", userId)
  } else if (!session.ended_at && !profile) {
    // Extremely unlikely — profile trigger should have created a row.
    await supabase.from("user_profiles").upsert({
      id: userId,
      email: "",
      xp_total: xpEarned,
      current_streak: nextStreak,
      longest_streak: nextLongest,
      last_active_date: todayStr,
    })
  }

  revalidatePath("/practice")
  revalidatePath("/")

  return { ok: true, xpEarned, streak: nextStreak }
}

// Convenience wrapper: end + redirect to summary. Used by the session page's
// exit button (form action).
export async function endSessionAndGoToSummary(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("sessionId") ?? "")
  if (!sessionId) redirect("/practice")
  await endSession(sessionId)
  redirect(`/practice/session/${sessionId}/summary`)
}
