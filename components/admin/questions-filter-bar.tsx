"use client"

import { useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"

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

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-3">
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
          <SelectTrigger>
            <SelectValue placeholder="Subject" />
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
          <SelectTrigger>
            <SelectValue
              placeholder={subject ? "Chapter" : "Pick subject first"}
            />
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
          <SelectTrigger>
            <SelectValue placeholder={chapter ? "Topic" : "Pick chapter first"} />
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
          <SelectTrigger>
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All difficulties</SelectItem>
            {[1, 2, 3, 4, 5].map((d) => (
              <SelectItem key={d} value={String(d)}>
                Difficulty {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status || ALL}
          onValueChange={(v) => setParam({ status: v === ALL ? null : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            setParam({ search: String(fd.get("search") ?? "") })
          }}
        >
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search question text..."
          />
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
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
