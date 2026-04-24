"use client"

import { useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ALL = "__all__"

// SelectValue's `children` can be a render function receiving the current
// underlying value; use it to turn a UUID back into a human-readable label.
function labeled(map: Map<string, string>, fallback: string) {
  return (value: unknown) => {
    if (typeof value !== "string" || value === ALL || value === "") {
      return fallback
    }
    return map.get(value) ?? fallback
  }
}

export function QuestionsFilterBar({
  subjects,
  chapters,
  topics,
}: {
  subjects: { id: string; name: string }[]
  chapters: { id: string; name: string; subject_id: string }[]
  topics: { id: string; name: string; chapter_id: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const subject = params.get("subject") ?? ""
  const chapter = params.get("chapter") ?? ""
  const topic = params.get("topic") ?? ""
  const difficulty = params.get("difficulty") ?? ""
  const status = params.get("status") ?? ""
  const search = params.get("search") ?? ""

  const filteredChapters = useMemo(
    () => (subject ? chapters.filter((c) => c.subject_id === subject) : []),
    [chapters, subject]
  )
  const filteredTopics = useMemo(
    () => (chapter ? topics.filter((t) => t.chapter_id === chapter) : []),
    [topics, chapter]
  )

  // Lookup maps UUID → human name, used to render SelectValue correctly.
  const subjectLabels = useMemo(
    () => new Map(subjects.map((s) => [s.id, s.name])),
    [subjects]
  )
  const chapterLabels = useMemo(
    () => new Map(chapters.map((c) => [c.id, c.name])),
    [chapters]
  )
  const topicLabels = useMemo(
    () => new Map(topics.map((t) => [t.id, t.name])),
    [topics]
  )
  const hasAnyFilter =
    !!subject ||
    !!chapter ||
    !!topic ||
    !!difficulty ||
    !!status ||
    !!search

  const setParam = (
    updates: Record<string, string | null>,
    resetPage = true
  ) => {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") sp.delete(k)
      else sp.set(k, v)
    }
    if (resetPage) sp.delete("page")
    startTransition(() => {
      router.replace(`${pathname}?${sp.toString()}`)
    })
  }

  const difficultyLabels: Record<string, string> = {
    "1": "1 · Easy",
    "2": "2 · Easy-Medium",
    "3": "3 · Medium",
    "4": "4 · Medium-Hard",
    "5": "5 · Hard",
  }

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
    flagged: "Flagged",
  }

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
        <Select
          value={subject || ALL}
          onValueChange={(v) =>
            setParam({
              subject: v === ALL ? null : v,
              chapter: null,
              topic: null,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Subject">
              {labeled(subjectLabels, "All subjects")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={chapter || ALL}
          onValueChange={(v) =>
            setParam({ chapter: v === ALL ? null : v, topic: null })
          }
          disabled={!subject}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={subject ? "Chapter" : "Pick subject first"}
            >
              {labeled(chapterLabels, "All chapters")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All chapters</SelectItem>
            {filteredChapters.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={topic || ALL}
          onValueChange={(v) => setParam({ topic: v === ALL ? null : v })}
          disabled={!chapter}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={chapter ? "Topic" : "Pick chapter first"}>
              {labeled(topicLabels, "All topics")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All topics</SelectItem>
            {filteredTopics.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={difficulty || ALL}
          onValueChange={(v) =>
            setParam({ difficulty: v === ALL ? null : v })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Difficulty">
              {(value) =>
                typeof value === "string" && value !== ALL && value
                  ? (difficultyLabels[value] ?? value)
                  : "All difficulties"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All difficulties</SelectItem>
            {Object.entries(difficultyLabels).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status || ALL}
          onValueChange={(v) => setParam({ status: v === ALL ? null : v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status">
              {(value) =>
                typeof value === "string" && value !== ALL && value
                  ? (statusLabels[value] ?? value)
                  : "All statuses"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.entries(statusLabels).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            setParam({ search: String(fd.get("search") ?? "") })
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search…"
            className="pl-7"
          />
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={pending || !hasAnyFilter}
          onClick={() => router.replace(pathname)}
        >
          <X /> Clear filters
        </Button>
        {pending ? (
          <span className="text-xs text-muted-foreground">Updating…</span>
        ) : null}
      </div>
    </div>
  )
}
