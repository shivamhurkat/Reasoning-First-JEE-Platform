import { notFound, redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  getQuestionWithSolutions,
  pickQuestionForSession,
} from "@/lib/queries/practice"
import { SessionClient } from "@/components/practice/session-client"
import { SessionExhausted } from "@/components/practice/session-exhausted"

export const dynamic = "force-dynamic"

export default async function SessionPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: session, error } = await supabase
    .from("practice_sessions")
    .select(
      "id, user_id, ended_at, started_at, topic_id, chapter_id, subject_id, session_type, topics(name), chapters(name), subjects(name)"
    )
    .eq("id", params.sessionId)
    .maybeSingle()

  if (error || !session) notFound()
  if (session.user_id !== user.id) notFound()

  // If already ended, bounce to summary.
  if (session.ended_at) {
    redirect(`/practice/session/${session.id}/summary`)
  }

  const scopeLabel =
    (session as unknown as { topics?: { name?: string } }).topics?.name ||
    (session as unknown as { chapters?: { name?: string } }).chapters?.name ||
    (session as unknown as { subjects?: { name?: string } }).subjects?.name ||
    "Mixed practice"

  // Count progress so the client can show "Question N of ∞".
  const { count: attemptsSoFar } = await supabase
    .from("practice_attempts")
    .select("*", { count: "exact", head: true })
    .eq("session_id", session.id)

  // Load initial question.
  const pick = await pickQuestionForSession(
    session.id,
    {
      topic_id: session.topic_id,
      chapter_id: session.chapter_id,
      subject_id: session.subject_id,
    },
    user.id
  )

  if (!pick.question) {
    return (
      <SessionExhausted
        sessionId={session.id}
        scopeLabel={scopeLabel}
        attemptsSoFar={attemptsSoFar ?? 0}
      />
    )
  }

  const full = await getQuestionWithSolutions(pick.question.id)
  if (!full) notFound()

  return (
    <SessionClient
      sessionId={session.id}
      scopeLabel={scopeLabel}
      initialQuestionNumber={(attemptsSoFar ?? 0) + 1}
      initialCorrectCount={0}
      initialAttempted={0}
      question={full.question}
      solutions={full.solutions}
    />
  )
}
