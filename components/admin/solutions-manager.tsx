"use client"

import { useMemo, useState, useTransition } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CheckCircle2, Circle, Pencil, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DifficultyPicker } from "@/components/admin/difficulty-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MathEditor } from "@/components/math-editor"
import { MathPreview } from "@/components/math-preview"
import {
  createSolution,
  deleteSolution,
  updateSolution,
  type SolutionInput,
} from "@/app/(admin)/admin/questions/[id]/solutions/actions"

type SolutionType =
  | "standard"
  | "logical"
  | "elimination"
  | "shortcut"
  | "trap_warning"
  | "pattern"

export type Solution = {
  id: string
  question_id: string
  solution_type: SolutionType
  title: string | null
  content: string
  steps: { step_number: number; text: string; explanation?: string | null }[] | null
  time_estimate_seconds: number | null
  when_to_use: string | null
  when_not_to_use: string | null
  prerequisites: string | null
  difficulty_to_execute: number | null
  status: "draft" | "published" | "ai_generated_unverified" | "flagged"
}

const SECTIONS: Array<{
  type: SolutionType
  title: string
  blurb: string
}> = [
  {
    type: "standard",
    title: "Standard Solution",
    blurb: "The textbook step-by-step solve.",
  },
  {
    type: "logical",
    title: "Logical Reasoning",
    blurb: "Principle-driven reasoning that avoids heavy computation.",
  },
  {
    type: "elimination",
    title: "Elimination Method",
    blurb: "Rule options out using dimensions, limits, or special cases.",
  },
  {
    type: "shortcut",
    title: "Shortcut / Trick",
    blurb: "A pattern or formula that cuts time dramatically.",
  },
  {
    type: "pattern",
    title: "Pattern Recognition",
    blurb: "Connects this question to a class of similar problems.",
  },
  {
    type: "trap_warning",
    title: "Traps & Common Mistakes",
    blurb: "What usually goes wrong and how to avoid it.",
  },
]

export function SolutionsManager({
  questionId,
  solutions,
}: {
  questionId: string
  solutions: Solution[]
}) {
  const byType = useMemo(() => {
    const m = new Map<SolutionType, Solution>()
    for (const s of solutions) m.set(s.solution_type, s)
    return m
  }, [solutions])

  const [dialog, setDialog] = useState<
    | null
    | { kind: "create"; type: SolutionType }
    | { kind: "edit"; solution: Solution }
    | { kind: "delete"; solution: Solution }
  >(null)

  const coveredCount = byType.size
  const totalTypes = SECTIONS.length

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completeness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>
                  Solutions: <strong>{coveredCount}</strong> / {totalTypes} types
                </span>
                <span className="text-xs text-muted-foreground">
                  {coveredCount >= 3
                    ? "Complete enough for students"
                    : "Aim for standard + one alternative + traps"}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full transition-all",
                    coveredCount >= 3 ? "bg-emerald-500" : "bg-primary"
                  )}
                  style={{ width: `${(coveredCount / totalTypes) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {SECTIONS.map((s) => (
                <Badge
                  key={s.type}
                  variant={byType.has(s.type) ? "default" : "outline"}
                  className="gap-1"
                >
                  {byType.has(s.type) ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <Circle className="size-3" />
                  )}
                  {s.type}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {SECTIONS.map((section) => {
          const existing = byType.get(section.type)
          return (
            <Card key={section.type}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {section.blurb}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {existing ? (
                      <>
                        <Badge
                          variant={
                            existing.status === "published" ? "default" : "outline"
                          }
                        >
                          {existing.status}
                        </Badge>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Edit"
                          onClick={() =>
                            setDialog({ kind: "edit", solution: existing })
                          }
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Delete"
                          onClick={() =>
                            setDialog({ kind: "delete", solution: existing })
                          }
                        >
                          <Trash2 />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          setDialog({ kind: "create", type: section.type })
                        }
                      >
                        <Plus /> Add
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {existing ? (
                <CardContent className="grid gap-3">
                  {existing.title ? (
                    <p className="text-sm font-medium">{existing.title}</p>
                  ) : null}
                  <MathPreview value={existing.content} />
                  {existing.steps && existing.steps.length > 0 ? (
                    <ol className="grid gap-2 text-sm">
                      {existing.steps.map((st, i) => (
                        <li key={i} className="rounded border p-2">
                          <div className="mb-1 text-xs font-medium text-muted-foreground">
                            Step {st.step_number}
                          </div>
                          <MathPreview value={st.text} />
                          {st.explanation ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {st.explanation}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  <div className="grid gap-1 text-xs text-muted-foreground">
                    {existing.time_estimate_seconds != null ? (
                      <div>⏱ {existing.time_estimate_seconds}s estimate</div>
                    ) : null}
                    {existing.when_to_use ? (
                      <div>
                        <strong>When to use:</strong> {existing.when_to_use}
                      </div>
                    ) : null}
                    {existing.when_not_to_use ? (
                      <div>
                        <strong>When not to use:</strong>{" "}
                        {existing.when_not_to_use}
                      </div>
                    ) : null}
                    {existing.prerequisites ? (
                      <div>
                        <strong>Prerequisites:</strong> {existing.prerequisites}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              ) : null}
            </Card>
          )
        })}
      </div>

      <SolutionDialog
        key={dialog ? JSON.stringify(dialog) : "none"}
        questionId={questionId}
        dialog={dialog}
        close={() => setDialog(null)}
      />
    </div>
  )
}

// ---------- Dialog ----------

const stepSchema = z.object({
  text: z.string().min(1, "Step text required"),
  explanation: z.string().optional(),
})

const formSchema = z.object({
  solution_type: z.enum([
    "standard",
    "logical",
    "elimination",
    "shortcut",
    "trap_warning",
    "pattern",
  ]),
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().min(1, "Content required"),
  steps: z.array(stepSchema),
  time_estimate_seconds: z.string(),
  when_to_use: z.string().optional(),
  when_not_to_use: z.string().optional(),
  prerequisites: z.string().optional(),
  difficulty_to_execute: z.number().int().min(1).max(5),
  status: z.enum(["draft", "published", "ai_generated_unverified", "flagged"]),
})

type FormValues = z.infer<typeof formSchema>

function SolutionDialog({
  questionId,
  dialog,
  close,
}: {
  questionId: string
  dialog:
    | null
    | { kind: "create"; type: SolutionType }
    | { kind: "edit"; solution: Solution }
    | { kind: "delete"; solution: Solution }
  close: () => void
}) {
  const [pending, startTransition] = useTransition()

  const initial: Solution | null =
    dialog?.kind === "edit" ? dialog.solution : null

  const defaults: FormValues = {
    solution_type:
      dialog?.kind === "create"
        ? dialog.type
        : dialog?.kind === "edit"
          ? dialog.solution.solution_type
          : "standard",
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    steps:
      initial?.steps?.map((s) => ({
        text: s.text,
        explanation: s.explanation ?? "",
      })) ?? [],
    time_estimate_seconds:
      initial?.time_estimate_seconds != null
        ? String(initial.time_estimate_seconds)
        : "",
    when_to_use: initial?.when_to_use ?? "",
    when_not_to_use: initial?.when_not_to_use ?? "",
    prerequisites: initial?.prerequisites ?? "",
    difficulty_to_execute: initial?.difficulty_to_execute ?? 3,
    status: initial?.status ?? "draft",
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  })
  const stepsArray = useFieldArray({ control: form.control, name: "steps" })

  if (!dialog) return null

  if (dialog.kind === "delete") {
    const handleDelete = () => {
      startTransition(async () => {
        const res = await deleteSolution(dialog.solution.id, questionId)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success("Solution deleted")
        close()
      })
    }
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete solution?</DialogTitle>
            <DialogDescription>
              This will remove the {dialog.solution.solution_type} solution for
              this question.
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

  const onSubmit = (values: FormValues) => {
    const payload: SolutionInput = {
      question_id: questionId,
      solution_type: values.solution_type,
      title: values.title?.trim() || null,
      content: values.content,
      steps:
        values.steps.length === 0
          ? null
          : values.steps.map((s, i) => ({
              step_number: i + 1,
              text: s.text,
              explanation: s.explanation?.trim() || null,
            })),
      time_estimate_seconds:
        values.time_estimate_seconds.trim() === ""
          ? null
          : Number(values.time_estimate_seconds),
      when_to_use: values.when_to_use?.trim() || null,
      when_not_to_use: values.when_not_to_use?.trim() || null,
      prerequisites: values.prerequisites?.trim() || null,
      difficulty_to_execute: values.difficulty_to_execute,
      status: values.status,
    }

    startTransition(async () => {
      const res =
        dialog.kind === "edit"
          ? await updateSolution(dialog.solution.id, payload)
          : await createSolution(payload)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(dialog.kind === "edit" ? "Solution updated" : "Solution added")
      close()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dialog.kind === "edit" ? "Edit" : "Add"}{" "}
            {SECTIONS.find((s) => s.type === defaults.solution_type)?.title}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4"
          noValidate
        >
          <div className="grid gap-2">
            <Label>Title (optional)</Label>
            <Controller
              control={form.control}
              name="title"
              render={({ field }) => (
                <Input
                  placeholder="Short descriptor (e.g. 'F=ma shortcut')"
                  {...field}
                />
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="content"
            render={({ field }) => (
              <div className="grid gap-1">
                <MathEditor
                  label="Content"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="The full reasoning. Use $...$ and $$...$$ for math."
                  minHeight={140}
                />
                {form.formState.errors.content ? (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.content.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Steps</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  stepsArray.append({ text: "", explanation: "" })
                }
              >
                <Plus /> Add step
              </Button>
            </div>
            <div className="grid gap-3">
              {stepsArray.fields.map((f, idx) => (
                <div key={f.id} className="grid gap-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Step {idx + 1}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="ml-auto"
                      onClick={() => stepsArray.remove(idx)}
                      aria-label="Remove step"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <Controller
                    control={form.control}
                    name={`steps.${idx}.text` as const}
                    render={({ field }) => (
                      <MathEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="What to do in this step"
                        minHeight={60}
                        compact
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`steps.${idx}.explanation` as const}
                    render={({ field }) => (
                      <Textarea
                        placeholder="Why this step works (optional)"
                        rows={2}
                        {...field}
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Time estimate (seconds)</Label>
              <Controller
                control={form.control}
                name="time_estimate_seconds"
                render={({ field }) => (
                  <Input
                    type="number"
                    placeholder="optional"
                    {...field}
                  />
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label>Difficulty to execute</Label>
              <Controller
                control={form.control}
                name="difficulty_to_execute"
                render={({ field }) => (
                  <DifficultyPicker
                    value={field.value}
                    onChange={field.onChange}
                    size="sm"
                  />
                )}
              />
            </div>
          </div>

          <Controller
            control={form.control}
            name="when_to_use"
            render={({ field }) => (
              <div className="grid gap-2">
                <Label>When to use this approach</Label>
                <Textarea rows={2} {...field} />
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="when_not_to_use"
            render={({ field }) => (
              <div className="grid gap-2">
                <Label>When NOT to use</Label>
                <Textarea rows={2} {...field} />
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="prerequisites"
            render={({ field }) => (
              <div className="grid gap-2">
                <Label>Prerequisites (optional)</Label>
                <Textarea rows={2} {...field} />
              </div>
            )}
          />

          <div className="grid gap-2 md:max-w-xs">
            <Label>Status</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="ai_generated_unverified">
                      AI-generated (unverified)
                    </SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
