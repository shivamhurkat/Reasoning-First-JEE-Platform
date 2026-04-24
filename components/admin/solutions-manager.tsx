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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { DifficultyPicker } from "@/components/admin/difficulty-picker"
import { ImageUpload } from "@/components/admin/image-upload"
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
  solution_image_url?: string | null
  steps: { step_number: number; text: string; explanation?: string | null }[] | null
  time_estimate_seconds: number | null
  when_to_use: string | null
  when_not_to_use: string | null
  prerequisites: string | null
  difficulty_to_execute: number | null
  status: "draft" | "published" | "ai_generated_unverified" | "flagged"
}

// ---------- Zod schema ----------

const stepSchema = z.object({
  text: z.string().min(1, "Step text required"),
  explanation: z.string().optional(),
})

const formSchema = z
  .object({
    solution_type: z.enum([
      "standard",
      "logical",
      "elimination",
      "shortcut",
      "trap_warning",
      "pattern",
    ]),
    title: z.string().trim().max(120).optional(),
    content: z.string().trim(),
    solution_image_url: z.string(),
    steps: z.array(stepSchema),
    time_estimate_seconds: z.string(),
    when_to_use: z.string().optional(),
    when_not_to_use: z.string().optional(),
    prerequisites: z.string().optional(),
    difficulty_to_execute: z.number().int().min(1).max(5),
    status: z.enum(["draft", "published", "ai_generated_unverified", "flagged"]),
  })
  .superRefine((val, ctx) => {
    if (!val.solution_image_url && val.content.trim().length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Content required, or upload a solution image",
      })
    }
  })

type FormValues = z.infer<typeof formSchema>

// ---------- Section config ----------

const ADDITIONAL_SECTIONS: Array<{
  type: SolutionType
  title: string
  blurb: string
}> = [
  {
    type: "elimination",
    title: "Elimination Method",
    blurb: "Rule options out using dimensions, limits, or special cases.",
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

type ActiveForm = { type: SolutionType; mode: "create" | "edit" } | null

// ---------- Main component ----------

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

  const [activeForm, setActiveForm] = useState<ActiveForm>(null)
  const [deleteTarget, setDeleteTarget] = useState<Solution | null>(null)

  const hasStandard = byType.has("standard")
  const hasShortcut = byType.has("shortcut")

  const openForm = (type: SolutionType, mode: "create" | "edit") =>
    setActiveForm({ type, mode })
  const closeForm = () => setActiveForm(null)

  const additionalCovered = ADDITIONAL_SECTIONS.filter((s) => byType.has(s.type)).length

  return (
    <div className="grid gap-4">
      {/* ---- Completeness indicator ---- */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <span className="text-sm font-medium text-muted-foreground">Content ready:</span>
        <Badge
          variant={hasStandard ? "default" : "outline"}
          className={cn("gap-1", hasStandard && "bg-emerald-600 text-white hover:bg-emerald-600")}
        >
          {hasStandard ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
          Standard
        </Badge>
        <Badge
          variant={hasShortcut ? "default" : "outline"}
          className={cn("gap-1", hasShortcut && "bg-emerald-600 text-white hover:bg-emerald-600")}
        >
          {hasShortcut ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
          Shortcut
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          {hasStandard && hasShortcut
            ? "Both required solutions present — question is content-ready"
            : "Add both Standard and Shortcut solutions to mark this question content-ready"}
        </span>
      </div>

      {/* ---- Primary: Standard ---- */}
      <PrimarySection
        sectionType="standard"
        title="Standard / Ideal Solution"
        blurb="The textbook step-by-step solution."
        solution={byType.get("standard")}
        questionId={questionId}
        activeForm={activeForm}
        onAdd={() => openForm("standard", "create")}
        onEdit={() => openForm("standard", "edit")}
        onClose={closeForm}
        onDelete={() => setDeleteTarget(byType.get("standard")!)}
        showWhenToUse={false}
      />

      {/* ---- Primary: Shortcut ---- */}
      <PrimarySection
        sectionType="shortcut"
        title="Shortcut / Reasoning-First Solution"
        blurb="A pattern or formula that cuts time dramatically."
        solution={byType.get("shortcut")}
        questionId={questionId}
        activeForm={activeForm}
        onAdd={() => openForm("shortcut", "create")}
        onEdit={() => openForm("shortcut", "edit")}
        onClose={closeForm}
        onDelete={() => setDeleteTarget(byType.get("shortcut")!)}
        showWhenToUse
      />

      {/* ---- Additional solutions accordion ---- */}
      <Accordion>
        <AccordionItem value="additional">
          <AccordionTrigger>
            Additional Solutions (optional) · {additionalCovered}/{ADDITIONAL_SECTIONS.length} added
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-3">
              {ADDITIONAL_SECTIONS.map((sec) => {
                const solution = byType.get(sec.type)
                const isFormOpen = activeForm?.type === sec.type
                const formMode = isFormOpen ? activeForm!.mode : null

                return (
                  <Card key={sec.type} className="border-muted/60">
                    <CardHeader className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{sec.title}</p>
                          <p className="text-xs text-muted-foreground">{sec.blurb}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {solution && !isFormOpen ? (
                            <>
                              <Badge
                                variant={solution.status === "published" ? "default" : "outline"}
                                className="text-xs"
                              >
                                {solution.status}
                              </Badge>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label="Edit"
                                onClick={() => openForm(sec.type, "edit")}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label="Delete"
                                onClick={() => setDeleteTarget(solution)}
                              >
                                <Trash2 />
                              </Button>
                            </>
                          ) : !isFormOpen ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openForm(sec.type, "create")}
                            >
                              <Plus /> Add
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    {solution && !isFormOpen ? (
                      <CardContent className="py-3">
                        <SolutionPreview solution={solution} />
                      </CardContent>
                    ) : null}
                    {isFormOpen ? (
                      <CardContent className="py-3">
                        <SolutionForm
                          questionId={questionId}
                          type={sec.type}
                          initial={formMode === "edit" ? (solution ?? null) : null}
                          onClose={closeForm}
                          showWhenToUse={false}
                        />
                      </CardContent>
                    ) : null}
                  </Card>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ---- Delete confirm dialog ---- */}
      <DeleteDialog
        solution={deleteTarget}
        questionId={questionId}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ---------- Primary section card ----------

function PrimarySection({
  sectionType,
  title,
  blurb,
  solution,
  questionId,
  activeForm,
  onAdd,
  onEdit,
  onClose,
  onDelete,
  showWhenToUse,
}: {
  sectionType: SolutionType
  title: string
  blurb: string
  solution: Solution | undefined
  questionId: string
  activeForm: ActiveForm
  onAdd: () => void
  onEdit: () => void
  onClose: () => void
  onDelete: () => void
  showWhenToUse: boolean
}) {
  const isFormOpen = activeForm?.type === sectionType
  const formMode = isFormOpen ? activeForm!.mode : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{blurb}</p>
          </div>
          {solution && !isFormOpen ? (
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant={solution.status === "published" ? "default" : "outline"}>
                {solution.status}
              </Badge>
              <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={onEdit}>
                <Pencil />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={onDelete}>
                <Trash2 />
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* Preview of existing solution */}
        {solution && !isFormOpen ? (
          <SolutionPreview solution={solution} />
        ) : null}

        {/* Empty state — prominent add button */}
        {!solution && !isFormOpen ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/30"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Plus className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Add {title}</p>
              <p className="text-xs text-muted-foreground">
                Upload an image or type the solution
              </p>
            </div>
          </button>
        ) : null}

        {/* Inline form */}
        {isFormOpen ? (
          <SolutionForm
            questionId={questionId}
            type={sectionType}
            initial={formMode === "edit" ? (solution ?? null) : null}
            onClose={onClose}
            showWhenToUse={showWhenToUse}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

// ---------- Solution preview (read-only) ----------

function SolutionPreview({ solution }: { solution: Solution }) {
  return (
    <div className="grid gap-3">
      {solution.title ? (
        <p className="text-sm font-medium">{solution.title}</p>
      ) : null}
      {solution.solution_image_url ? (
        <div className="overflow-hidden rounded-md border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={solution.solution_image_url}
            alt="Solution"
            className="w-full object-contain max-h-[400px]"
          />
        </div>
      ) : null}
      {solution.content ? <MathPreview value={solution.content} /> : null}
      {solution.steps && solution.steps.length > 0 ? (
        <ol className="grid gap-2 text-sm">
          {solution.steps.map((st, i) => (
            <li key={i} className="rounded border p-2">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Step {st.step_number}
              </div>
              <MathPreview value={st.text} />
              {st.explanation ? (
                <p className="mt-1 text-xs text-muted-foreground">{st.explanation}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      <div className="grid gap-1 text-xs text-muted-foreground">
        {solution.time_estimate_seconds != null ? (
          <div>⏱ {solution.time_estimate_seconds}s estimate</div>
        ) : null}
        {solution.when_to_use ? (
          <div>
            <strong>When to use:</strong> {solution.when_to_use}
          </div>
        ) : null}
        {solution.when_not_to_use ? (
          <div>
            <strong>When not to use:</strong> {solution.when_not_to_use}
          </div>
        ) : null}
        {solution.prerequisites ? (
          <div>
            <strong>Prerequisites:</strong> {solution.prerequisites}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ---------- Inline solution form ----------

function SolutionForm({
  questionId,
  type,
  initial,
  onClose,
  showWhenToUse,
}: {
  questionId: string
  type: SolutionType
  initial: Solution | null
  onClose: () => void
  showWhenToUse: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [contentMode, setContentMode] = useState<"text" | "image">(
    initial?.solution_image_url ? "image" : "text"
  )

  const defaults: FormValues = {
    solution_type: type,
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    solution_image_url: initial?.solution_image_url ?? "",
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

  const onSubmit = (values: FormValues) => {
    const payload: SolutionInput = {
      question_id: questionId,
      solution_type: values.solution_type,
      title: values.title?.trim() || null,
      content: values.content,
      solution_image_url: values.solution_image_url || null,
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
      const res = initial
        ? await updateSolution(initial.id, payload)
        : await createSolution(payload)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(initial ? "Solution updated" : "Solution added")
      onClose()
    })
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-4 rounded-lg border bg-muted/20 p-4"
      noValidate
    >
      {/* Title (optional) */}
      <div className="grid gap-2">
        <Label>Title (optional)</Label>
        <Controller
          control={form.control}
          name="title"
          render={({ field }) => (
            <Input placeholder="Short descriptor (e.g. 'F=ma shortcut')" {...field} />
          )}
        />
      </div>

      {/* Content mode toggle */}
      <div className="grid gap-2">
        <Label>Solution content</Label>
        <div className="flex gap-1 rounded-lg border p-1 w-fit">
          <button
            type="button"
            onClick={() => {
              setContentMode("text")
              form.setValue("solution_image_url", "")
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              contentMode === "text"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Type Solution
          </button>
          <button
            type="button"
            onClick={() => setContentMode("image")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              contentMode === "image"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Upload Image
          </button>
        </div>
      </div>

      {contentMode === "image" ? (
        <Controller
          control={form.control}
          name="solution_image_url"
          render={({ field }) => (
            <div className="grid gap-2">
              <ImageUpload
                value={field.value || null}
                onChange={(url) => field.onChange(url ?? "")}
                folder="solutions"
              />
              <Controller
                control={form.control}
                name="content"
                render={({ field: tf }) => (
                  <MathEditor
                    label="Supplemental text (optional)"
                    value={tf.value}
                    onChange={tf.onChange}
                    placeholder="Additional notes or steps…"
                    minHeight={80}
                    compact
                  />
                )}
              />
              {form.formState.errors.content ? (
                <p className="text-destructive text-xs">
                  {form.formState.errors.content.message}
                </p>
              ) : null}
            </div>
          )}
        />
      ) : (
        <Controller
          control={form.control}
          name="content"
          render={({ field }) => (
            <div className="grid gap-1">
              <MathEditor
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
      )}

      {/* Steps */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Steps (optional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => stepsArray.append({ text: "", explanation: "" })}
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

      {/* Time estimate */}
      <div className="grid gap-2 md:max-w-xs">
        <Label>Time estimate (seconds)</Label>
        <Controller
          control={form.control}
          name="time_estimate_seconds"
          render={({ field }) => (
            <Input type="number" placeholder="optional" {...field} />
          )}
        />
      </div>

      {/* When to use / not use (shortcut section only) */}
      {showWhenToUse ? (
        <>
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
        </>
      ) : null}

      {/* Difficulty + status */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Difficulty to execute</Label>
          <Controller
            control={form.control}
            name="difficulty_to_execute"
            render={({ field }) => (
              <DifficultyPicker value={field.value} onChange={field.onChange} size="sm" />
            )}
          />
        </div>
        <div className="grid gap-2">
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
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  )
}

// ---------- Delete confirmation dialog ----------

function DeleteDialog({
  solution,
  questionId,
  onClose,
}: {
  solution: Solution | null
  questionId: string
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!solution) return
    startTransition(async () => {
      const res = await deleteSolution(solution.id, questionId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Solution deleted")
      onClose()
    })
  }

  return (
    <Dialog open={!!solution} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete solution?</DialogTitle>
          <DialogDescription>
            This will remove the {solution?.solution_type} solution for this question.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
