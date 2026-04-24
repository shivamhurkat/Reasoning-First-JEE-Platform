import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { SolutionType } from "@/lib/constants/practice"

// ---------- Shared types ----------

export type QuestionType =
  | "single_correct"
  | "multi_correct"
  | "numerical"
  | "subjective"

export type QuestionOption = { id: string; text: string }

export type CorrectAnswer =
  | { type: "single"; value: string }
  | { type: "multi"; values: string[] }
  | { type: "numerical"; value: number; tolerance?: number }
  | { type: "subjective"; value: string }

export type QuestionData = {
  id: string
  topic_id: string
  question_text: string
  question_image_url: string | null
  question_type: QuestionType
  options: QuestionOption[] | null
  correct_answer: CorrectAnswer
  difficulty: number
  estimated_time_seconds: number
  source: string | null
  year: number | null
  topic_name: string | null
  chapter_name: string | null
  subject_name: string | null
}

export type SolutionData = {
  id: string
  solution_type: SolutionType
  title: string | null
  content: string
  solution_image_url: string | null
  steps:
    | Array<{ step_number: number; text: string; explanation?: string | null }>
    | null
  time_estimate_seconds: number | null
  when_to_use: string | null
  when_not_to_use: string | null
  prerequisites: string | null
  difficulty_to_execute: number | null
}

// ---------- Subjects with counts ----------

export type SubjectWithStats = {
  id: string
  name: string
  slug: string
  questionCount: number
  userAttempted: number
  userAccuracy: number | null
}

export async function getSubjectsWithCounts(
  userId: string
): Promise<SubjectWithStats[]> {
  const supabase = createClient()
  const [subjectsRes, questionsRes, attemptsRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, slug, display_order, chapters(id, topics(id))")
      .order("display_order", { ascending: true }),
    supabase
      .from("questions")
      .select("id, topic_id")
      .eq("status", "published"),
    supabase
      .from("practice_attempts")
      .select("question_id, is_correct")
      .eq("user_id", userId),
  ])

  const subjects = subjectsRes.data ?? []
  const questions = questionsRes.data ?? []
  const attempts = attemptsRes.data ?? []

  // questionId → topicId
  const questionTopic = new Map<string, string>()
  for (const q of questions) questionTopic.set(q.id, q.topic_id)

  type Row = { id: string; chapters: Array<{ topics: Array<{ id: string }> }> }

  return subjects.map((s) => {
    const topicIds = new Set<string>()
    for (const ch of (s as unknown as Row).chapters ?? []) {
      for (const t of ch.topics ?? []) topicIds.add(t.id)
    }
    const qIds = new Set<string>()
    for (const q of questions) if (topicIds.has(q.topic_id)) qIds.add(q.id)

    let total = 0
    let correct = 0
    for (const a of attempts) {
      if (!qIds.has(a.question_id)) continue
      total++
      if (a.is_correct) correct++
    }

    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      questionCount: qIds.size,
      userAttempted: total,
      userAccuracy: total > 0 ? Math.round((correct / total) * 100) : null,
    }
  })
}

// ---------- Chapters for subject ----------

export type SubjectDetail = {
  id: string
  name: string
  slug: string
}

export type ChapterWithStats = {
  id: string
  name: string
  slug: string
  weightagePercent: number | null
  questionCount: number
  userAttempted: number
  userAccuracy: number | null
}

export async function getChaptersForSubject(
  subjectSlug: string,
  userId: string
): Promise<{ subject: SubjectDetail; chapters: ChapterWithStats[] } | null> {
  const supabase = createClient()
  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, slug")
    .eq("slug", subjectSlug)
    .maybeSingle()
  if (!subject) return null

  const [chaptersRes, questionsRes, attemptsRes] = await Promise.all([
    supabase
      .from("chapters")
      .select(
        "id, name, slug, display_order, weightage_percent, topics(id)"
      )
      .eq("subject_id", subject.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("questions")
      .select("id, topic_id")
      .eq("status", "published"),
    supabase
      .from("practice_attempts")
      .select("question_id, is_correct")
      .eq("user_id", userId),
  ])

  const chapters = chaptersRes.data ?? []
  const questions = questionsRes.data ?? []
  const attempts = attemptsRes.data ?? []

  const questionsByTopic = new Map<string, Set<string>>()
  for (const q of questions) {
    let set = questionsByTopic.get(q.topic_id)
    if (!set) {
      set = new Set()
      questionsByTopic.set(q.topic_id, set)
    }
    set.add(q.id)
  }

  const mapped: ChapterWithStats[] = chapters.map((c) => {
    const topics = ((c as unknown as { topics?: Array<{ id: string }> }).topics ?? [])
    const qIds = new Set<string>()
    for (const t of topics) {
      const set = questionsByTopic.get(t.id)
      if (set) set.forEach((id) => qIds.add(id))
    }
    let total = 0
    let correct = 0
    for (const a of attempts) {
      if (!qIds.has(a.question_id)) continue
      total++
      if (a.is_correct) correct++
    }
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      weightagePercent: c.weightage_percent,
      questionCount: qIds.size,
      userAttempted: total,
      userAccuracy: total > 0 ? Math.round((correct / total) * 100) : null,
    }
  })

  return { subject, chapters: mapped }
}

// ---------- Topics for chapter ----------

export type ChapterDetail = {
  id: string
  name: string
  slug: string
  subject: SubjectDetail
}

export type TopicWithStats = {
  id: string
  name: string
  slug: string
  questionCount: number
  userAttempted: number
  userAccuracy: number | null
}

export async function getTopicsForChapter(
  subjectSlug: string,
  chapterSlug: string,
  userId: string
): Promise<{ chapter: ChapterDetail; topics: TopicWithStats[] } | null> {
  const supabase = createClient()
  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, slug")
    .eq("slug", subjectSlug)
    .maybeSingle()
  if (!subject) return null

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, name, slug")
    .eq("slug", chapterSlug)
    .eq("subject_id", subject.id)
    .maybeSingle()
  if (!chapter) return null

  const [topicsRes, questionsRes, attemptsRes] = await Promise.all([
    supabase
      .from("topics")
      .select("id, name, slug, display_order")
      .eq("chapter_id", chapter.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("questions")
      .select("id, topic_id")
      .eq("status", "published"),
    supabase
      .from("practice_attempts")
      .select("question_id, is_correct")
      .eq("user_id", userId),
  ])

  const topics = topicsRes.data ?? []
  const questions = questionsRes.data ?? []
  const attempts = attemptsRes.data ?? []

  const questionsByTopic = new Map<string, Set<string>>()
  for (const q of questions) {
    let set = questionsByTopic.get(q.topic_id)
    if (!set) {
      set = new Set()
      questionsByTopic.set(q.topic_id, set)
    }
    set.add(q.id)
  }

  const mapped: TopicWithStats[] = topics.map((t) => {
    const qIds = questionsByTopic.get(t.id) ?? new Set<string>()
    let total = 0
    let correct = 0
    for (const a of attempts) {
      if (!qIds.has(a.question_id)) continue
      total++
      if (a.is_correct) correct++
    }
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      questionCount: qIds.size,
      userAttempted: total,
      userAccuracy: total > 0 ? Math.round((correct / total) * 100) : null,
    }
  })

  return { chapter: { ...chapter, subject }, topics: mapped }
}

// ---------- Question loading ----------

type SessionScope = {
  topic_id: string | null
  chapter_id: string | null
  subject_id: string | null
}

// Collect all published question IDs in a session's scope.
async function questionIdsInScope(
  supabase: ReturnType<typeof createClient>,
  scope: SessionScope
): Promise<string[]> {
  let q = supabase.from("questions").select("id").eq("status", "published")

  if (scope.topic_id) {
    q = q.eq("topic_id", scope.topic_id)
    const { data } = await q
    return (data ?? []).map((r) => r.id)
  }
  if (scope.chapter_id) {
    const { data: topics } = await supabase
      .from("topics")
      .select("id")
      .eq("chapter_id", scope.chapter_id)
    const ids = (topics ?? []).map((t) => t.id)
    if (ids.length === 0) return []
    q = q.in("topic_id", ids)
    const { data } = await q
    return (data ?? []).map((r) => r.id)
  }
  if (scope.subject_id) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("id")
      .eq("subject_id", scope.subject_id)
    const chIds = (chapters ?? []).map((c) => c.id)
    if (chIds.length === 0) return []
    const { data: topics } = await supabase
      .from("topics")
      .select("id")
      .in("chapter_id", chIds)
    const tIds = (topics ?? []).map((t) => t.id)
    if (tIds.length === 0) return []
    q = q.in("topic_id", tIds)
    const { data } = await q
    return (data ?? []).map((r) => r.id)
  }
  // Mixed: all published
  const { data } = await q
  return (data ?? []).map((r) => r.id)
}

async function loadQuestion(
  supabase: ReturnType<typeof createClient>,
  questionId: string
): Promise<QuestionData | null> {
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, topic_id, question_text, question_image_url, question_type, options, correct_answer, difficulty, estimated_time_seconds, source, year, topics(name, chapters(name, subjects(name)))"
    )
    .eq("id", questionId)
    .maybeSingle()
  if (error || !data) return null

  const t = (data as unknown as {
    topics?: {
      name?: string
      chapters?: { name?: string; subjects?: { name?: string } | null } | null
    } | null
  }).topics

  return {
    id: data.id,
    topic_id: data.topic_id,
    question_text: data.question_text,
    question_image_url: (data as unknown as { question_image_url?: string | null }).question_image_url ?? null,
    question_type: data.question_type as QuestionType,
    options: data.options as QuestionOption[] | null,
    correct_answer: data.correct_answer as CorrectAnswer,
    difficulty: data.difficulty,
    estimated_time_seconds: data.estimated_time_seconds,
    source: data.source,
    year: data.year,
    topic_name: t?.name ?? null,
    chapter_name: t?.chapters?.name ?? null,
    subject_name: t?.chapters?.subjects?.name ?? null,
  }
}

// Pick the next question to serve inside a session scope. Prefers questions
// the user hasn't attempted inside this session; falls back to picking the
// least-recently-attempted one if everything has been seen.
export async function pickQuestionForSession(
  sessionId: string,
  scope: SessionScope,
  userId: string
): Promise<{ question: QuestionData | null; exhausted: boolean }> {
  const supabase = createClient()

  const poolIds = await questionIdsInScope(supabase, scope)
  if (poolIds.length === 0) {
    return { question: null, exhausted: true }
  }

  const { data: sessionAttempts } = await supabase
    .from("practice_attempts")
    .select("question_id")
    .eq("session_id", sessionId)

  const attempted = new Set(
    (sessionAttempts ?? []).map((r) => r.question_id as string)
  )

  const unattempted = poolIds.filter((id) => !attempted.has(id))

  if (unattempted.length > 0) {
    const pick = unattempted[Math.floor(Math.random() * unattempted.length)]
    const question = await loadQuestion(supabase, pick)
    return { question, exhausted: false }
  }

  // Scope fully exhausted in this session.
  void userId
  return { question: null, exhausted: true }
}

export async function getNextQuestionForTopic(
  topicId: string,
  userId: string
): Promise<QuestionData | null> {
  const supabase = createClient()
  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .eq("topic_id", topicId)
    .eq("status", "published")
  const poolIds = (questions ?? []).map((q) => q.id)
  if (poolIds.length === 0) return null

  const { data: userAttempts } = await supabase
    .from("practice_attempts")
    .select("question_id, attempted_at")
    .eq("user_id", userId)
    .in("question_id", poolIds)
    .order("attempted_at", { ascending: true })

  const attemptedSet = new Set(
    (userAttempts ?? []).map((r) => r.question_id as string)
  )
  const unattempted = poolIds.filter((id) => !attemptedSet.has(id))

  if (unattempted.length > 0) {
    const pick = unattempted[Math.floor(Math.random() * unattempted.length)]
    return loadQuestion(supabase, pick)
  }

  // All attempted → least recently attempted.
  const sorted = [...(userAttempts ?? [])]
  if (sorted.length === 0) return null
  const pick = sorted[0].question_id
  return loadQuestion(supabase, pick)
}

export async function getQuestionWithSolutions(questionId: string): Promise<{
  question: QuestionData
  solutions: SolutionData[]
} | null> {
  const supabase = createClient()
  const [qRes, sRes] = await Promise.all([
    loadQuestion(supabase, questionId),
    supabase
      .from("solutions")
      .select("*")
      .eq("question_id", questionId)
      .eq("status", "published")
      .order("created_at", { ascending: true }),
  ])

  if (!qRes) return null
  const solutions = ((sRes.data ?? []) as unknown as Array<{
    id: string
    solution_type: string
    title: string | null
    content: string
    solution_image_url: string | null
    steps: unknown
    time_estimate_seconds: number | null
    when_to_use: string | null
    when_not_to_use: string | null
    prerequisites: string | null
    difficulty_to_execute: number | null
  }>).map<SolutionData>((s) => ({
    id: s.id,
    solution_type: s.solution_type as SolutionType,
    title: s.title,
    content: s.content,
    solution_image_url: s.solution_image_url ?? null,
    steps: (s.steps as SolutionData["steps"]) ?? null,
    time_estimate_seconds: s.time_estimate_seconds,
    when_to_use: s.when_to_use,
    when_not_to_use: s.when_not_to_use,
    prerequisites: s.prerequisites,
    difficulty_to_execute: s.difficulty_to_execute,
  }))
  return { question: qRes, solutions }
}
