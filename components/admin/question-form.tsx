"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { MathEditor } from "@/components/math-editor"
import {
  createQuestion,
  updateQuestion,
  type QuestionInput,
} from "@/app/(admin)/admin/questions/actions"

// ---------- Types ----------

export type TopicOption = {
  id: string
  name: string
  chapter_id: string
}
export type ChapterOption = {
  id: string
  name: string
  subject_id: string
}
export type SubjectOption = { id: string; name: string }

export type QuestionFormInitial = {
  id?: string
  subject_id?: string | null
  chapter_id?: string | null
  topic_id: string
  question_text: string
  question_type: "single_correct" | "multi_correct" | "numerical" | "subjective"
  options?: { id: string; text: string }[] | null
  correct_answer:
    | { type: "single"; value: string }
    | { type: "multi"; values: string[] }
    | { type: "numerical"; value: number; tolerance?: number }
    | { type: "subjective"; value: string }
    | Record<string, unknown>
    | null
  difficulty: number
  estimated_time_seconds: number
  source?: string | null
  year?: number | null
  status: "draft" | "published" | "archived" | "flagged"
}

// ---------- Zod (client-side mirror; server re-validates) ----------

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Option text required"),
})

const formSchema = z
  .object({
    subject_id: z.string().min(1, "Subject required"),
    chapter_id: z.string().min(1, "Chapter required"),
    topic_id: z.string().uuid("Topic required"),
    question_type: z.enum([
      "single_correct",
      "multi_correct",
      "numerical",
      "subjective",
    ]),
    question_text: z.string().trim().min(10, "Question must be at least 10 chars"),
    options: z.array(optionSchema),
    correct_option_id: z.string(),
    correct_option_ids: z.array(z.string()),
    numerical_value: z.string(), // number input held as string
    numerical_tolerance: z.string(),
    subjective_answer: z.string(),
    difficulty: z.number().int().min(1).max(5),
    estimated_time_seconds: z.number().int().min(10).max(3600),
    source: z.string(),
    year: z.string(),
    status: z.enum(["draft", "published", "archived", "flagged"]),
  })
  .superRefine((val, ctx) => {
    if (val.question_type === "single_correct") {
      if (val.options.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "At least 4 options required",
        })
      }
      if (!val.correct_option_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correct_option_id"],
          message: "Select the correct option",
        })
      }
    }
    if (val.question_type === "multi_correct") {
      if (val.options.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "At least 4 options required",
        })
      }
      if (val.correct_option_ids.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correct_option_ids"],
          message: "Mark at least one correct option",
        })
      }
    }
    if (val.question_type === "numerical") {
      if (val.numerical_value.trim() === "" || !Number.isFinite(Number(val.numerical_value))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["numerical_value"],
          message: "Enter a number",
        })
      }
      if (val.numerical_tolerance.trim() !== "" && !Number.isFinite(Number(val.numerical_tolerance))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["numerical_tolerance"],
          message: "Tolerance must be a number",
        })
      }
    }
    if (val.question_type === "subjective") {
      if (val.subjective_answer.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["subjective_answer"],
          message: "Provide a reference answer",
        })
      }
    }
  })

type FormValues = z.infer<typeof formSchema>

const OPTION_LETTERS = ["a", "b", "c", "d", "e", "f"] as const
const DIFFICULTY_LABELS = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"]

// ---------- Component ----------

export function QuestionForm({
  subjects,
  chapters,
  topics,
  initial,
  mode,
}: {
  subjects: SubjectOption[]
  chapters: ChapterOption[]
  topics: TopicOption[]
  initial?: QuestionFormInitial
  mode: "create" | "edit"
}) {
  const router = useRouter()
  const [submitting, startTransition] = useTransition()
  const [afterSave, setAfterSave] = useState<
    "solutions" | "another" | "list"
  >("solutions")

  const defaultSubject: string = initial?.subject_id ?? ""
  const defaultChapter: string = initial?.chapter_id ?? ""
  const defaultTopic: string = initial?.topic_id ?? ""

  const defaultValues: FormValues = {
    subject_id: defaultSubject,
    chapter_id: defaultChapter,
    topic_id: defaultTopic,
    question_type: initial?.question_type ?? "single_correct",
    question_text: initial?.question_text ?? "",
    options:
      initial?.options && initial.options.length > 0
        ? initial.options
        : [
            { id: "a", text: "" },
            { id: "b", text: "" },
            { id: "c", text: "" },
            { id: "d", text: "" },
          ],
    correct_option_id:
      initial?.correct_answer && (initial.correct_answer as { type?: string }).type === "single"
        ? ((initial.correct_answer as { value: string }).value ?? "")
        : "",
    correct_option_ids:
      initial?.correct_answer && (initial.correct_answer as { type?: string }).type === "multi"
        ? ((initial.correct_answer as { values: string[] }).values ?? [])
        : [],
    numerical_value:
      initial?.correct_answer && (initial.correct_answer as { type?: string }).type === "numerical"
        ? String((initial.correct_answer as { value: number }).value)
        : "",
    numerical_tolerance:
      initial?.correct_answer && (initial.correct_answer as { type?: string }).type === "numerical"
        ? String((initial.correct_answer as { tolerance?: number }).tolerance ?? 0.01)
        : "0.01",
    subjective_answer:
      initial?.correct_answer && (initial.correct_answer as { type?: string }).type === "subjective"
        ? String((initial.correct_answer as { value: string }).value ?? "")
        : "",
    difficulty: initial?.difficulty ?? 3,
    estimated_time_seconds: initial?.estimated_time_seconds ?? 120,
    source: initial?.source ?? "",
    year: initial?.year != null ? String(initial.year) : "",
    status: initial?.status ?? "draft",
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onSubmit",
  })

  const { control, handleSubmit, watch, setValue, formState } = form
  const subjectId = watch("subject_id")
  const chapterId = watch("chapter_id")
  const qType = watch("question_type")

  const filteredChapters = useMemo(
    () => chapters.filter((c) => c.subject_id === subjectId),
    [chapters, subjectId]
  )
  const filteredTopics = useMemo(
    () => topics.filter((t) => t.chapter_id === chapterId),
    [topics, chapterId]
  )

  const optionsArray = useFieldArray({ control, name: "options" })

  // If admin changes subject, reset chapter/topic. Similarly chapter → topic.
  const onSubjectChange = (id: string) => {
    setValue("subject_id", id)
    setValue("chapter_id", "")
    setValue("topic_id", "")
  }
  const onChapterChange = (id: string) => {
    setValue("chapter_id", id)
    setValue("topic_id", "")
  }

  const onSubmit = (values: FormValues) => {
    // Map form → server action shape
    let payload: QuestionInput
    const common = {
      topic_id: values.topic_id,
      question_text: values.question_text,
      difficulty: values.difficulty,
      estimated_time_seconds: values.estimated_time_seconds,
      source: values.source.trim() || null,
      year: values.year.trim() === "" ? null : Number(values.year),
      status:
        afterSave === "solutions" && mode === "create"
          ? ("draft" as const)
          : values.status,
    }
    if (values.question_type === "single_correct") {
      payload = {
        ...common,
        question_type: "single_correct",
        options: values.options,
        correct_option_id: values.correct_option_id,
      }
    } else if (values.question_type === "multi_correct") {
      payload = {
        ...common,
        question_type: "multi_correct",
        options: values.options,
        correct_option_ids: values.correct_option_ids,
      }
    } else if (values.question_type === "numerical") {
      payload = {
        ...common,
        question_type: "numerical",
        numerical_value: Number(values.numerical_value),
        numerical_tolerance:
          values.numerical_tolerance.trim() === ""
            ? 0.01
            : Number(values.numerical_tolerance),
      }
    } else {
      payload = {
        ...common,
        question_type: "subjective",
        subjective_answer: values.subjective_answer,
      }
    }

    startTransition(async () => {
      if (mode === "create") {
        const res = await createQuestion(payload)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success("Question saved as draft")
        if (afterSave === "solutions") {
          router.push(`/admin/questions/${res.data.id}/solutions`)
        } else if (afterSave === "another") {
          // Preserve subject/chapter/topic, clear the rest.
          form.reset({
            ...defaultValues,
            subject_id: values.subject_id,
            chapter_id: values.chapter_id,
            topic_id: values.topic_id,
          })
          window.scrollTo({ top: 0, behavior: "smooth" })
        } else {
          router.push("/admin/questions")
        }
      } else {
        const res = await updateQuestion(initial!.id!, payload)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success("Question updated")
        router.push("/admin/questions")
      }
    })
  }

  const formErrors = formState.errors

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6" noValidate>
      {/* Taxonomy */}
      <Card>
        <CardHeader>
          <CardTitle>Taxonomy</CardTitle>
          <CardDescription>
            Where does this question live in the curriculum?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Subject</Label>
            <Controller
              control={control}
              name="subject_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    const next = v ?? ""
                    field.onChange(next)
                    onSubjectChange(next)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {formErrors.subject_id ? (
              <p className="text-destructive text-xs">
                {formErrors.subject_id.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Chapter</Label>
            <Controller
              control={control}
              name="chapter_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    const next = v ?? ""
                    field.onChange(next)
                    onChapterChange(next)
                  }}
                  disabled={!subjectId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={subjectId ? "Select chapter" : "Pick subject first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredChapters.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {formErrors.chapter_id ? (
              <p className="text-destructive text-xs">
                {formErrors.chapter_id.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Topic</Label>
            <Controller
              control={control}
              name="topic_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!chapterId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={chapterId ? "Select topic" : "Pick chapter first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTopics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {formErrors.topic_id ? (
              <p className="text-destructive text-xs">
                {formErrors.topic_id.message}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Type + Question text */}
      <Card>
        <CardHeader>
          <CardTitle>Question</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Type</Label>
            <Controller
              control={control}
              name="question_type"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { v: "single_correct", label: "Single correct" },
                      { v: "multi_correct", label: "Multi correct" },
                      { v: "numerical", label: "Numerical" },
                      { v: "subjective", label: "Subjective" },
                    ] as const
                  ).map((o) => {
                    const active = field.value === o.v
                    return (
                      <button
                        type="button"
                        key={o.v}
                        onClick={() => field.onChange(o.v)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          <Controller
            control={control}
            name="question_text"
            render={({ field }) => (
              <div className="grid gap-1">
                <MathEditor
                  label="Question text"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Write the question. Wrap math in $...$ (inline) or $$...$$ (block)."
                  minHeight={160}
                />
                {formErrors.question_text ? (
                  <p className="text-destructive text-xs">
                    {formErrors.question_text.message}
                  </p>
                ) : null}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Answer section */}
      <Card>
        <CardHeader>
          <CardTitle>Answer</CardTitle>
          <CardDescription>
            {qType === "numerical"
              ? "Numerical value and acceptable tolerance."
              : qType === "subjective"
                ? "A reference answer used by the grader."
                : "Options and which one(s) are correct."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {(qType === "single_correct" || qType === "multi_correct") && (
            <div className="grid gap-3">
              {optionsArray.fields.map((field, idx) => {
                const letter = OPTION_LETTERS[idx]
                return (
                  <div
                    key={field.id}
                    className="grid gap-2 rounded-md border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono uppercase">
                        {letter}
                      </Badge>
                      <Controller
                        control={control}
                        name="correct_option_id"
                        render={({ field: cf }) =>
                          qType === "single_correct" ? (
                            <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <input
                                type="radio"
                                checked={cf.value === letter}
                                onChange={() => cf.onChange(letter)}
                              />
                              Correct
                            </label>
                          ) : (
                            <span />
                          )
                        }
                      />
                      {qType === "multi_correct" ? (
                        <Controller
                          control={control}
                          name="correct_option_ids"
                          render={({ field: cf }) => (
                            <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Checkbox
                                checked={cf.value.includes(letter)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    cf.onChange([...cf.value, letter])
                                  } else {
                                    cf.onChange(cf.value.filter((x) => x !== letter))
                                  }
                                }}
                              />
                              Correct
                            </label>
                          )}
                        />
                      ) : null}
                      <div className="ml-auto">
                        {optionsArray.fields.length > 4 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              optionsArray.remove(idx)
                              // Clean up any references to this letter in correct selections.
                              const single = form.getValues("correct_option_id")
                              if (single === letter) setValue("correct_option_id", "")
                              const multi = form.getValues("correct_option_ids")
                              if (multi.includes(letter)) {
                                setValue(
                                  "correct_option_ids",
                                  multi.filter((x) => x !== letter)
                                )
                              }
                            }}
                            aria-label="Remove option"
                          >
                            <Trash2 />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <Controller
                      control={control}
                      name={`options.${idx}.text` as const}
                      render={({ field: tf }) => (
                        <MathEditor
                          value={tf.value}
                          onChange={tf.onChange}
                          placeholder={`Option ${letter.toUpperCase()}`}
                          minHeight={60}
                          compact
                        />
                      )}
                    />
                  </div>
                )
              })}
              {optionsArray.fields.length < 6 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const nextLetter = OPTION_LETTERS[optionsArray.fields.length]
                    optionsArray.append({ id: nextLetter, text: "" })
                  }}
                >
                  <Plus /> Add option
                </Button>
              ) : null}

              {formErrors.correct_option_id ? (
                <p className="text-destructive text-xs">
                  {formErrors.correct_option_id.message}
                </p>
              ) : null}
              {formErrors.correct_option_ids ? (
                <p className="text-destructive text-xs">
                  {formErrors.correct_option_ids.message}
                </p>
              ) : null}
              {formErrors.options ? (
                <p className="text-destructive text-xs">
                  {(formErrors.options as { message?: string })?.message ??
                    "Check the options"}
                </p>
              ) : null}
            </div>
          )}

          {qType === "numerical" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Numerical answer</Label>
                <Controller
                  control={control}
                  name="numerical_value"
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 9.81"
                      {...field}
                    />
                  )}
                />
                {formErrors.numerical_value ? (
                  <p className="text-destructive text-xs">
                    {formErrors.numerical_value.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Tolerance (±)</Label>
                <Controller
                  control={control}
                  name="numerical_tolerance"
                  render={({ field }) => (
                    <Input type="number" step="any" {...field} />
                  )}
                />
                {formErrors.numerical_tolerance ? (
                  <p className="text-destructive text-xs">
                    {formErrors.numerical_tolerance.message}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {qType === "subjective" && (
            <Controller
              control={control}
              name="subjective_answer"
              render={({ field }) => (
                <div className="grid gap-1">
                  <MathEditor
                    label="Reference answer"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Model answer / grading rubric"
                    minHeight={120}
                  />
                  {formErrors.subjective_answer ? (
                    <p className="text-destructive text-xs">
                      {formErrors.subjective_answer.message}
                    </p>
                  ) : null}
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Meta */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Difficulty</Label>
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <Badge variant="secondary">
                    {field.value} · {DIFFICULTY_LABELS[field.value - 1]}
                  </Badge>
                )}
              />
            </div>
            <Controller
              control={control}
              name="difficulty"
              render={({ field }) => (
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[field.value]}
                  onValueChange={(v) =>
                    field.onChange(Array.isArray(v) ? (v[0] ?? 1) : v)
                  }
                />
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Estimated time (seconds)</Label>
              <Controller
                control={control}
                name="estimated_time_seconds"
                render={({ field }) => (
                  <Input
                    type="number"
                    min={10}
                    max={3600}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label>Source</Label>
              <Controller
                control={control}
                name="source"
                render={({ field }) => (
                  <Input placeholder="e.g. JEE Mains 2023 Shift 1" {...field} />
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label>Year</Label>
              <Controller
                control={control}
                name="year"
                render={({ field }) => (
                  <Input type="number" placeholder="optional" {...field} />
                )}
              />
            </div>
          </div>

          <div className="grid gap-2 md:max-w-xs">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          render={<Link href="/admin/questions" />}
          variant="ghost"
          disabled={submitting}
        >
          Cancel
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          {mode === "create" ? (
            <>
              <Button
                type="submit"
                variant="outline"
                disabled={submitting}
                onClick={() => setAfterSave("another")}
              >
                Save & Add Another
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                onClick={() => setAfterSave("solutions")}
              >
                {submitting ? "Saving..." : "Save as Draft → Solutions"}
              </Button>
            </>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
