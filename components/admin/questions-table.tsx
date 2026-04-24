"use client"

import Link from "next/link"
import { useMemo, useOptimistic, useState, useTransition } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import { toast } from "sonner"
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  CopyPlus,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  Wrench,
} from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MathInlinePreview } from "@/components/math-preview"
import {
  bulkDelete,
  bulkUpdateStatus,
  deleteQuestion,
  duplicateQuestion,
} from "@/app/(admin)/admin/questions/actions"

export type QuestionRow = {
  id: string
  question_text: string
  question_type:
    | "single_correct"
    | "multi_correct"
    | "numerical"
    | "subjective"
  difficulty: number
  status: "draft" | "published" | "archived" | "flagged"
  source: string | null
  created_at: string
  subject_name: string
  chapter_name: string
  topic_name: string
  solutions_count: number
}

const STATUS_TONE: Record<
  QuestionRow["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  published: "default",
  archived: "secondary",
  flagged: "destructive",
}

const TYPE_LABEL: Record<QuestionRow["question_type"], string> = {
  single_correct: "Single",
  multi_correct: "Multi",
  numerical: "Numerical",
  subjective: "Subjective",
}

export function QuestionsTable({
  rows,
  total,
  page,
  pageSize,
  totalPages,
}: {
  rows: QuestionRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<
    | null
    | { kind: "delete-one"; id: string }
    | { kind: "bulk-delete" }
  >(null)
  const [pending, startTransition] = useTransition()

  // Optimistic view: apply pending status/delete changes locally so the UI
  // updates the instant the user clicks, without waiting for the server
  // roundtrip + revalidation.
  type Patch =
    | { kind: "status"; ids: string[]; status: QuestionRow["status"] }
    | { kind: "delete"; ids: string[] }
  const [optimisticRows, applyPatch] = useOptimistic<QuestionRow[], Patch>(
    rows,
    (current, patch) => {
      if (patch.kind === "delete") {
        const del = new Set(patch.ids)
        return current.filter((r) => !del.has(r.id))
      }
      const ids = new Set(patch.ids)
      return current.map((r) =>
        ids.has(r.id) ? { ...r, status: patch.status } : r
      )
    }
  )
  const displayRows = optimisticRows

  const allChecked =
    displayRows.length > 0 && displayRows.every((r) => selected.has(r.id))
  const someChecked = displayRows.some((r) => selected.has(r.id))

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    if (allChecked) {
      setSelected((prev) => {
        const next = new Set(prev)
        rows.forEach((r) => next.delete(r.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        rows.forEach((r) => next.add(r.id))
        return next
      })
    }
  }

  const goToPage = (next: number) => {
    const sp = new URLSearchParams(params.toString())
    sp.set("page", String(next))
    router.replace(`${pathname}?${sp.toString()}`)
  }

  const selectedIds = useMemo(() => Array.from(selected), [selected])

  const runBulk = (
    status: "published" | "archived" | null,
    deleting = false
  ) => {
    const ids = selectedIds
    startTransition(async () => {
      if (deleting) {
        applyPatch({ kind: "delete", ids })
      } else if (status) {
        applyPatch({ kind: "status", ids, status })
      }
      const res = deleting
        ? await bulkDelete(ids)
        : await bulkUpdateStatus(ids, status!)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(
        deleting
          ? `Deleted ${res.data.count} question${res.data.count === 1 ? "" : "s"}`
          : `Moved ${res.data.count} to ${status}`
      )
      setSelected(new Set())
      setConfirm(null)
    })
  }

  const runDeleteOne = (id: string) => {
    startTransition(async () => {
      applyPatch({ kind: "delete", ids: [id] })
      const res = await deleteQuestion(id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Question deleted")
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setConfirm(null)
    })
  }

  const runDuplicate = (id: string) => {
    startTransition(async () => {
      const res = await duplicateQuestion(id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Duplicated as draft")
      router.push(`/admin/questions/${res.data.id}/edit`)
    })
  }

  const runStatus = (id: string, status: "published" | "archived") => {
    startTransition(async () => {
      applyPatch({ kind: "status", ids: [id], status })
      const res = await bulkUpdateStatus([id], status)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(status === "published" ? "Published" : "Archived")
    })
  }

  return (
    <div className="grid gap-3">
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-primary/5 p-2">
          <span className="px-1 text-sm">
            {selected.size} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => runBulk("published")}
          >
            <Send /> Publish
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => runBulk("archived")}
          >
            <Archive /> Archive
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => setConfirm({ kind: "bulk-delete" })}
          >
            <Trash2 /> Delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      ) : null}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onCheckedChange={toggleAll}
                  aria-label="Select all on page"
                />
              </TableHead>
              <TableHead>Question</TableHead>
              <TableHead className="w-64">Taxonomy</TableHead>
              <TableHead className="w-24">Difficulty</TableHead>
              <TableHead className="w-24">Type</TableHead>
              <TableHead className="w-20">Solns</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-28">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  No questions match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((r) => (
                <TableRow
                  key={r.id}
                  data-state={selected.has(r.id) ? "selected" : undefined}
                  className={selected.has(r.id) ? "bg-muted/40" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggleRow(r.id)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/questions/${r.id}/solutions`}
                      className="block max-w-[520px] hover:underline"
                    >
                      <MathInlinePreview value={r.question_text} maxChars={110} />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {r.subject_name}{" › "}{r.chapter_name}
                    </div>
                    <div className="text-sm">{r.topic_name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.difficulty}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{TYPE_LABEL[r.question_type]}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.solutions_count >= 3 ? "default" : "outline"}
                      className={cn(
                        r.solutions_count >= 3 && "bg-emerald-600 text-white hover:bg-emerald-600"
                      )}
                    >
                      {r.solutions_count}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_TONE[r.status]}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNowStrict(new Date(r.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Row actions"
                          >
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          render={<Link href={`/admin/questions/${r.id}/edit`} />}
                        >
                          <Pencil /> Edit question
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          render={<Link href={`/admin/questions/${r.id}/solutions`} />}
                        >
                          <Wrench /> Manage solutions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => runDuplicate(r.id)}>
                          <CopyPlus /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {r.status !== "published" ? (
                          <DropdownMenuItem
                            onClick={() => runStatus(r.id, "published")}
                          >
                            <Send /> Publish
                          </DropdownMenuItem>
                        ) : null}
                        {r.status !== "archived" ? (
                          <DropdownMenuItem onClick={() => runStatus(r.id, "archived")}>
                            <Archive /> Archive
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setConfirm({ kind: "delete-one", id: r.id })}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {total} total · page {page} of {totalPages} · {pageSize}/page
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="outline"
            disabled={page <= 1 || pending}
            onClick={() => goToPage(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={page >= totalPages || pending}
            onClick={() => goToPage(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === "bulk-delete"
                ? `Delete ${selected.size} question${selected.size === 1 ? "" : "s"}?`
                : "Delete this question?"}
            </DialogTitle>
            <DialogDescription>
              All solutions and student attempts will be permanently removed.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (confirm?.kind === "bulk-delete") runBulk(null, true)
                else if (confirm?.kind === "delete-one") runDeleteOne(confirm.id)
              }}
            >
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
