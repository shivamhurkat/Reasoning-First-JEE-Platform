import "server-only"

import { createClient } from "@/lib/supabase/server"

// ── Helpers ──────────────────────────────────────────────────────────────────

export function fmtTime(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return m > 0 ? `${m}m` : "<1m"
}

// ── Overview stats ────────────────────────────────────────────────────────────
// Potential slow query at high attempt counts: add index on
// practice_attempts(user_id). (Flag for indexing.)

export type OverviewStats = {
  totalAttempted: number
  accuracy: number | null
  totalTimeSeconds: number
  totalTimeFormatted: string
  currentStreak: number
}

export async function getOverviewStats(userId: string): Promise<OverviewStats> {
  const supabase = createClient()
  const [attemptsRes, profileRes] = await Promise.all([
    supabase
      .from("practice_attempts")
      .select("is_correct, time_taken_seconds, chosen_approach")
      .eq("user_id", userId),
    supabase
      .from("user_profiles")
      .select("current_streak")
      .eq("id", userId)
      .maybeSingle(),
  ])

  const attempts = attemptsRes.data ?? []
  const nonSkipped = attempts.filter((a) => a.chosen_approach !== "skip")
  const correct = nonSkipped.filter((a) => a.is_correct === true).length
  const totalTimeSeconds = attempts.reduce(
    (s, a) => s + (a.time_taken_seconds ?? 0),
    0
  )

  return {
    totalAttempted: attempts.length,
    accuracy:
      nonSkipped.length > 0
        ? Math.round((correct / nonSkipped.length) * 100)
        : null,
    totalTimeSeconds,
    totalTimeFormatted: fmtTime(totalTimeSeconds),
    currentStreak: profileRes.data?.current_streak ?? 0,
  }
}

// ── Mastery data (shared hierarchy fetch) ─────────────────────────────────────
// One DB round-trip; subject mastery, topic mastery, and weak topics are all
// derived from the same attempt rows.
//
// Potential slow query at scale: add indexes on practice_attempts(user_id)
// and questions(topic_id). (Flag for indexing.)

type HierarchyRow = {
  is_correct: boolean | null
  questions: {
    topic_id: string
    topics: {
      id: string
      name: string
      chapters: {
        id: string
        name: string
        subjects: { id: string; name: string; slug: string } | null
      } | null
    } | null
  } | null
}

async function fetchHierarchy(userId: string): Promise<HierarchyRow[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("practice_attempts")
    .select(
      "is_correct, questions(topic_id, topics(id, name, chapters(id, name, subjects(id, name, slug))))"
    )
    .eq("user_id", userId)
  return (data as unknown as HierarchyRow[]) ?? []
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type SubjectMastery = {
  id: string
  name: string
  slug: string
  attempted: number
  correct: number
  accuracy: number | null
  strongestTopic: string | null
  weakestTopic: string | null
}

export type TopicRow = {
  topicId: string
  topicName: string
  attempted: number
  correct: number
  accuracy: number | null
}

export type TopicMasteryBySubject = {
  subjectId: string
  subjectName: string
  subjectSlug: string
  topics: TopicRow[]
}

export type WeakTopic = {
  topicId: string
  topicName: string
  subjectName: string
  attempted: number
  accuracy: number
}

export type MasteryData = {
  subjectMastery: SubjectMastery[]
  topicMastery: TopicMasteryBySubject[]
  weakTopics: WeakTopic[]
}

// ── getMasteryData ────────────────────────────────────────────────────────────

export async function getMasteryData(userId: string): Promise<MasteryData> {
  const rows = await fetchHierarchy(userId)

  // Accumulators typed explicitly to avoid TypeScript Map iteration issues.
  type TopicBucket = { name: string; total: number; correct: number }
  type SubjectBucket = {
    id: string
    name: string
    slug: string
    total: number
    correct: number
    topicMap: Record<string, TopicBucket>
  }
  const subjectMap: Record<string, SubjectBucket> = {}

  for (const r of rows) {
    const topic = r.questions?.topics
    if (!topic) continue
    const sub = topic.chapters?.subjects
    if (!sub) continue

    // subject bucket
    if (!subjectMap[sub.id]) {
      subjectMap[sub.id] = {
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        total: 0,
        correct: 0,
        topicMap: {},
      }
    }
    subjectMap[sub.id].total++
    if (r.is_correct === true) subjectMap[sub.id].correct++

    // topic bucket within subject
    if (!subjectMap[sub.id].topicMap[topic.id]) {
      subjectMap[sub.id].topicMap[topic.id] = {
        name: topic.name,
        total: 0,
        correct: 0,
      }
    }
    subjectMap[sub.id].topicMap[topic.id].total++
    if (r.is_correct === true) subjectMap[sub.id].topicMap[topic.id].correct++
  }

  const subjectMastery: SubjectMastery[] = []
  const topicMastery: TopicMasteryBySubject[] = []
  const weakTopics: WeakTopic[] = []

  for (const sb of Object.values(subjectMap)) {
    // Build topic rows from the plain object map (avoids Map iterator issues).
    const topicRows: TopicRow[] = Object.entries(sb.topicMap)
      .filter(([, v]) => v.total >= 1)
      .map(([topicId, v]) => ({
        topicId,
        topicName: v.name,
        attempted: v.total,
        correct: v.correct,
        accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : null,
      }))
      .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100))

    // Strongest / weakest need ≥3 attempts to be statistically meaningful.
    const qualified = topicRows.filter((t) => t.attempted >= 3)
    const weakestTopic = qualified[0]?.topicName ?? null
    const strongestTopic = qualified[qualified.length - 1]?.topicName ?? null

    subjectMastery.push({
      id: sb.id,
      name: sb.name,
      slug: sb.slug,
      attempted: sb.total,
      correct: sb.correct,
      accuracy: sb.total > 0 ? Math.round((sb.correct / sb.total) * 100) : null,
      weakestTopic,
      strongestTopic,
    })

    if (topicRows.length > 0) {
      topicMastery.push({
        subjectId: sb.id,
        subjectName: sb.name,
        subjectSlug: sb.slug,
        topics: topicRows,
      })
    }

    // Collect weak topics (accuracy < 50%, ≥5 attempts).
    for (const t of topicRows) {
      if (t.attempted >= 5 && (t.accuracy ?? 100) < 50) {
        weakTopics.push({
          topicId: t.topicId,
          topicName: t.topicName,
          subjectName: sb.name,
          attempted: t.attempted,
          accuracy: t.accuracy!,
        })
      }
    }
  }

  weakTopics.sort((a, b) => a.accuracy - b.accuracy)

  return { subjectMastery, topicMastery, weakTopics }
}

// ── Recent sessions ───────────────────────────────────────────────────────────

export type RecentSession = {
  id: string
  startedAt: string
  endedAt: string
  scope: string
  totalQuestions: number
  correctCount: number
  accuracy: number | null
  totalTimeSeconds: number
}

export async function getRecentSessions(
  userId: string,
  limit = 10
): Promise<RecentSession[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("practice_sessions")
    .select(
      "id, started_at, ended_at, total_questions, correct_count, total_time_seconds, topics(name), chapters(name), subjects(name)"
    )
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit)

  return ((data ?? []) as unknown as Array<{
    id: string
    started_at: string
    ended_at: string
    total_questions: number | null
    correct_count: number | null
    total_time_seconds: number | null
    topics?: { name?: string } | null
    chapters?: { name?: string } | null
    subjects?: { name?: string } | null
  }>).map((s) => {
    const total = s.total_questions ?? 0
    const correct = s.correct_count ?? 0
    return {
      id: s.id,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      scope:
        s.topics?.name ||
        s.chapters?.name ||
        s.subjects?.name ||
        "Mixed practice",
      totalQuestions: total,
      correctCount: correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
      totalTimeSeconds: s.total_time_seconds ?? 0,
    }
  })
}
