"use client"

import { useEffect } from "react"
import { toast } from "sonner"

const MESSAGES: Record<string, { kind: "error" | "success"; text: string }> = {
  empty_topic: {
    kind: "error",
    text: "No questions available yet — try another topic.",
  },
  session_failed: {
    kind: "error",
    text: "Could not start a session. Try again.",
  },
}

export function PracticeToast({ error }: { error?: string }) {
  useEffect(() => {
    if (!error) return
    const m = MESSAGES[error]
    if (!m) return
    if (m.kind === "error") toast.error(m.text)
    else toast.success(m.text)
  }, [error])
  return null
}
