"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ChevronRight, Pencil, Plus, Sprout, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { slugify } from "@/lib/utils/slug"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createChapter,
  createSubject,
  createTopic,
  deleteChapter,
  deleteSubject,
  deleteTopic,
  seedCurriculum,
  updateChapter,
  updateSubject,
  updateTopic,
} from "@/app/(admin)/admin/subjects/actions"

type Topic = {
  id: string
  chapter_id: string
  name: string
  slug: string
  display_order: number
}
type Chapter = {
  id: string
  subject_id: string
  name: string
  slug: string
  display_order: number
  weightage_percent: number | null
  topics: Topic[]
}
type Subject = {
  id: string
  name: string
  slug: string
  exam: string
  display_order: number
  chapters: Chapter[]
}

type DialogState =
  | null
  | { kind: "new-subject" }
  | { kind: "edit-subject"; subject: Subject }
  | { kind: "new-chapter"; subjectId: string; nextOrder: number }
  | { kind: "edit-chapter"; chapter: Chapter }
  | { kind: "new-topic"; chapterId: string; nextOrder: number }
  | { kind: "edit-topic"; topic: Topic }
  | {
      kind: "confirm-delete"
      what: "subject" | "chapter" | "topic"
      id: string
      label: string
      dependents: string
    }

export function CurriculumTree({ subjects }: { subjects: Subject[] }) {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [pending, startTransition] = useTransition()

  const toggle = (key: string) =>
    setExpanded((s) => ({ ...s, [key]: !s[key] }))

  const handleSeed = () => {
    startTransition(async () => {
      const res = await seedCurriculum()
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(
        `Seeded ${res.inserted?.subjects ?? 0} subjects, ${
          res.inserted?.chapters ?? 0
        } chapters, ${res.inserted?.topics ?? 0} topics.`
      )
    })
  }

  const confirmDelete = (state: Extract<DialogState, { kind: "confirm-delete" }>) =>
    setDialog(state)

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setDialog({ kind: "new-subject" })}>
          <Plus /> Add Subject
        </Button>
        <LoadingButton
          variant="outline"
          disabled={subjects.length > 0}
          loading={pending}
          loadingText="Seeding…"
          onClick={handleSeed}
          title={
            subjects.length > 0
              ? "Seed disabled once curriculum has data"
              : undefined
          }
        >
          <Sprout /> Seed JEE Curriculum
        </LoadingButton>
        <span className="ml-auto text-xs text-muted-foreground">
          {subjects.length} subject{subjects.length === 1 ? "" : "s"}
        </span>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No subjects yet. Click <strong>Seed JEE Curriculum</strong> for the
          standard tree, or <strong>Add Subject</strong> to build it manually.
        </div>
      ) : null}

      <div className="grid gap-3">
        {subjects.map((s) => {
          const openSubj = expanded[`s:${s.id}`] ?? true
          return (
            <div key={s.id} className="rounded-lg border bg-card">
              <div className="flex items-center gap-2 p-3">
                <button
                  type="button"
                  onClick={() => toggle(`s:${s.id}`)}
                  className="inline-flex size-6 items-center justify-center rounded hover:bg-muted"
                  aria-label={openSubj ? "Collapse" : "Expand"}
                >
                  {openSubj ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.name}</span>
                    <Badge variant="secondary">{s.exam}</Badge>
                    <Badge variant="outline">
                      {s.chapters.length} chapter
                      {s.chapters.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    slug: <code>{s.slug}</code> · order {s.display_order}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDialog({
                      kind: "new-chapter",
                      subjectId: s.id,
                      nextOrder: s.chapters.length,
                    })
                  }
                >
                  <Plus /> Chapter
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDialog({ kind: "edit-subject", subject: s })}
                  aria-label="Edit subject"
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    const nCh = s.chapters.length
                    const nTp = s.chapters.reduce(
                      (sum, c) => sum + c.topics.length,
                      0
                    )
                    confirmDelete({
                      kind: "confirm-delete",
                      what: "subject",
                      id: s.id,
                      label: s.name,
                      dependents: `${nCh} chapter${nCh === 1 ? "" : "s"} and ${nTp} topic${nTp === 1 ? "" : "s"}`,
                    })
                  }}
                  aria-label="Delete subject"
                >
                  <Trash2 />
                </Button>
              </div>

              {openSubj ? (
                <div className="grid gap-2 border-t bg-muted/20 p-3">
                  {s.chapters.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No chapters yet.
                    </p>
                  ) : (
                    s.chapters.map((c) => {
                      const openChap = expanded[`c:${c.id}`] ?? false
                      return (
                        <div
                          key={c.id}
                          className="rounded-md border bg-background"
                        >
                          <div className="flex items-center gap-2 p-2.5">
                            <button
                              type="button"
                              onClick={() => toggle(`c:${c.id}`)}
                              className="inline-flex size-6 items-center justify-center rounded hover:bg-muted"
                              aria-label={openChap ? "Collapse" : "Expand"}
                            >
                              {openChap ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{c.name}</span>
                                <Badge variant="outline">
                                  {c.topics.length} topic
                                  {c.topics.length === 1 ? "" : "s"}
                                </Badge>
                                <WeightageInline chapter={c} />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                slug: <code>{c.slug}</code> · order{" "}
                                {c.display_order}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDialog({
                                  kind: "new-topic",
                                  chapterId: c.id,
                                  nextOrder: c.topics.length,
                                })
                              }
                            >
                              <Plus /> Topic
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() =>
                                setDialog({ kind: "edit-chapter", chapter: c })
                              }
                              aria-label="Edit chapter"
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() =>
                                confirmDelete({
                                  kind: "confirm-delete",
                                  what: "chapter",
                                  id: c.id,
                                  label: c.name,
                                  dependents: `${c.topics.length} topic${c.topics.length === 1 ? "" : "s"}`,
                                })
                              }
                              aria-label="Delete chapter"
                            >
                              <Trash2 />
                            </Button>
                          </div>

                          {openChap ? (
                            <div className="grid gap-1 border-t bg-muted/10 p-2">
                              {c.topics.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  No topics yet.
                                </p>
                              ) : (
                                c.topics.map((t) => (
                                  <div
                                    key={t.id}
                                    className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/60"
                                  >
                                    <div className="flex-1">
                                      <span>{t.name}</span>
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        <code>{t.slug}</code> · order{" "}
                                        {t.display_order}
                                      </span>
                                    </div>
                                    <Button
                                      size="icon-xs"
                                      variant="ghost"
                                      onClick={() =>
                                        setDialog({
                                          kind: "edit-topic",
                                          topic: t,
                                        })
                                      }
                                      aria-label="Edit topic"
                                    >
                                      <Pencil />
                                    </Button>
                                    <Button
                                      size="icon-xs"
                                      variant="ghost"
                                      onClick={() =>
                                        confirmDelete({
                                          kind: "confirm-delete",
                                          what: "topic",
                                          id: t.id,
                                          label: t.name,
                                          dependents: "no dependents",
                                        })
                                      }
                                      aria-label="Delete topic"
                                    >
                                      <Trash2 />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <CurriculumDialog dialog={dialog} close={() => setDialog(null)} />
    </div>
  )
}

// ---------- Inline weightage editor ----------

function WeightageInline({ chapter }: { chapter: Chapter }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(
    chapter.weightage_percent?.toString() ?? ""
  )
  const [pending, startTransition] = useTransition()

  if (!editing) {
    return (
      <button
        type="button"
        className={cn(
          "rounded px-2 py-0.5 text-xs transition-colors",
          chapter.weightage_percent != null
            ? "bg-primary/10 text-primary hover:bg-primary/15"
            : "text-muted-foreground hover:bg-muted"
        )}
        onClick={() => setEditing(true)}
      >
        {chapter.weightage_percent != null
          ? `${chapter.weightage_percent}% weight`
          : "Set weight"}
      </button>
    )
  }

  const save = () => {
    const trimmed = draft.trim()
    const parsed = trimmed === "" ? null : Number(trimmed)
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0 || parsed > 100)) {
      toast.error("Weight must be between 0 and 100")
      return
    }
    startTransition(async () => {
      const res = await updateChapter(chapter.id, {
        weightage_percent: parsed as number | null,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Weightage updated")
      setEditing(false)
    })
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Input
        type="number"
        step="0.1"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-6 w-20 text-xs"
        disabled={pending}
        autoFocus
      />
      <Button size="xs" onClick={save} disabled={pending}>
        Save
      </Button>
      <Button
        size="xs"
        variant="ghost"
        onClick={() => {
          setDraft(chapter.weightage_percent?.toString() ?? "")
          setEditing(false)
        }}
        disabled={pending}
      >
        Cancel
      </Button>
    </span>
  )
}

// ---------- Dialog router ----------

function CurriculumDialog({
  dialog,
  close,
}: {
  dialog: DialogState
  close: () => void
}) {
  if (!dialog) return null

  switch (dialog.kind) {
    case "new-subject":
      return <SubjectFormDialog close={close} />
    case "edit-subject":
      return <SubjectFormDialog close={close} initial={dialog.subject} />
    case "new-chapter":
      return (
        <ChapterFormDialog
          close={close}
          subjectId={dialog.subjectId}
          nextOrder={dialog.nextOrder}
        />
      )
    case "edit-chapter":
      return <ChapterFormDialog close={close} initial={dialog.chapter} />
    case "new-topic":
      return (
        <TopicFormDialog
          close={close}
          chapterId={dialog.chapterId}
          nextOrder={dialog.nextOrder}
        />
      )
    case "edit-topic":
      return <TopicFormDialog close={close} initial={dialog.topic} />
    case "confirm-delete":
      return <DeleteConfirmDialog dialog={dialog} close={close} />
  }
}

// ---------- Subject dialog ----------

function SubjectFormDialog({
  close,
  initial,
}: {
  close: () => void
  initial?: Subject
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [exam, setExam] = useState(initial?.exam ?? "jee_mains")
  const [order, setOrder] = useState(String(initial?.display_order ?? 0))
  const [pending, startTransition] = useTransition()

  const onName = (n: string) => {
    setName(n)
    if (!slugTouched) setSlug(slugify(n))
  }

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    const displayOrder = Number(order) || 0
    startTransition(async () => {
      const res = initial
        ? await updateSubject(initial.id, {
            name,
            slug: slug || slugify(name),
            exam: exam as "jee_mains" | "jee_advanced" | "neet",
            display_order: displayOrder,
          })
        : await createSubject({
            name,
            slug: slug || slugify(name),
            exam: exam as "jee_mains" | "jee_advanced" | "neet",
            display_order: displayOrder,
          })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(initial ? "Subject updated" : "Subject created")
      close()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit subject" : "Add subject"}</DialogTitle>
          <DialogDescription>
            Slug auto-fills from the name. Both must be unique.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="s-name">Name</Label>
            <Input
              id="s-name"
              value={name}
              onChange={(e) => onName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-slug">Slug</Label>
            <Input
              id="s-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugTouched(true)
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-exam">Exam</Label>
            <Select
              value={exam}
              onValueChange={(v) => setExam(v ?? "jee_mains")}
            >
              <SelectTrigger id="s-exam">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jee_mains">JEE Mains</SelectItem>
                <SelectItem value="jee_advanced">JEE Advanced</SelectItem>
                <SelectItem value="neet">NEET</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-order">Display order</Label>
            <Input
              id="s-order"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Chapter dialog ----------

function ChapterFormDialog({
  close,
  subjectId,
  initial,
  nextOrder,
}: {
  close: () => void
  subjectId?: string
  initial?: Chapter
  nextOrder?: number
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [order, setOrder] = useState(
    String(initial?.display_order ?? nextOrder ?? 0)
  )
  const [weight, setWeight] = useState(
    initial?.weightage_percent?.toString() ?? ""
  )
  const [pending, startTransition] = useTransition()

  const onName = (n: string) => {
    setName(n)
    if (!slugTouched) setSlug(slugify(n))
  }

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    const displayOrder = Number(order) || 0
    const weightVal = weight.trim() === "" ? null : Number(weight)
    if (
      weightVal !== null &&
      (!Number.isFinite(weightVal) || weightVal < 0 || weightVal > 100)
    ) {
      toast.error("Weight must be 0–100")
      return
    }
    startTransition(async () => {
      const res = initial
        ? await updateChapter(initial.id, {
            name,
            slug: slug || slugify(name),
            display_order: displayOrder,
            weightage_percent: weightVal,
          })
        : await createChapter({
            subject_id: subjectId!,
            name,
            slug: slug || slugify(name),
            display_order: displayOrder,
            weightage_percent: weightVal,
          })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(initial ? "Chapter updated" : "Chapter created")
      close()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit chapter" : "Add chapter"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Name</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => onName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-slug">Slug</Label>
            <Input
              id="c-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugTouched(true)
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="c-order">Display order</Label>
              <Input
                id="c-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-weight">Weightage %</Label>
              <Input
                id="c-weight"
                type="number"
                step="0.1"
                placeholder="optional"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Topic dialog ----------

function TopicFormDialog({
  close,
  chapterId,
  initial,
  nextOrder,
}: {
  close: () => void
  chapterId?: string
  initial?: Topic
  nextOrder?: number
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [order, setOrder] = useState(
    String(initial?.display_order ?? nextOrder ?? 0)
  )
  const [pending, startTransition] = useTransition()

  const onName = (n: string) => {
    setName(n)
    if (!slugTouched) setSlug(slugify(n))
  }

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    const displayOrder = Number(order) || 0
    startTransition(async () => {
      const res = initial
        ? await updateTopic(initial.id, {
            name,
            slug: slug || slugify(name),
            display_order: displayOrder,
          })
        : await createTopic({
            chapter_id: chapterId!,
            name,
            slug: slug || slugify(name),
            display_order: displayOrder,
          })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(initial ? "Topic updated" : "Topic created")
      close()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit topic" : "Add topic"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="t-name">Name</Label>
            <Input
              id="t-name"
              value={name}
              onChange={(e) => onName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-slug">Slug</Label>
            <Input
              id="t-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugTouched(true)
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-order">Display order</Label>
            <Input
              id="t-order"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Delete confirmation ----------

function DeleteConfirmDialog({
  dialog,
  close,
}: {
  dialog: Extract<DialogState, { kind: "confirm-delete" }>
  close: () => void
}) {
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const fn =
        dialog.what === "subject"
          ? deleteSubject
          : dialog.what === "chapter"
            ? deleteChapter
            : deleteTopic
      const res = await fn(dialog.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Deleted ${dialog.what}: ${dialog.label}`)
      close()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {dialog.what}?</DialogTitle>
          <DialogDescription>
            You&apos;re about to delete <strong>{dialog.label}</strong>. This
            cascades to {dialog.dependents} and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
