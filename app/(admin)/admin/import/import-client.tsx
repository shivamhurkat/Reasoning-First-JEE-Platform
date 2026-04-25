"use client"

import {
  useState,
  useTransition,
  useRef,
  useCallback,
} from "react"
import Papa from "papaparse"
import { toast } from "sonner"
import {
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react"

import {
  importQuestionsFromCSV,
  importQuestionsFromImages,
  type ParsedRow,
  type ImageImportMetadata,
} from "./actions"
import { uploadContentImage } from "@/lib/supabase/storage"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

// ── Types ──────────────────────────────────────────────────────────────────────

type Subject = { id: string; name: string }
type Chapter = { id: string; name: string; subject_id: string }
type Topic = { id: string; name: string; chapter_id: string }

type ValidatedRow = ParsedRow & { _valid: boolean; _error?: string }

// ── CSV column order used in template ─────────────────────────────────────────

const CSV_HEADERS = [
  "subject",
  "chapter",
  "topic",
  "question_type",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "difficulty",
  "source",
  "year",
  "standard_solution",
  "shortcut_solution",
]

const CSV_EXAMPLE_ROWS = [
  [
    "Physics",
    "Mechanics",
    "Kinematics",
    "single_correct",
    "A ball starts from rest with acceleration 10 m/s². Its velocity after 2 s is:",
    "10 m/s",
    "20 m/s",
    "30 m/s",
    "40 m/s",
    "b",
    "3",
    "JEE Mains 2023",
    "2023",
    "Using kinematic equation $v = u + at$, substituting values: $v = 0 + 10(2) = 20$ m/s. Answer is (B).",
    "Shortcut: For constant acceleration from rest, $v = at$. Directly $10 \\times 2 = 20$. No need for other equations.",
  ],
  [
    "Chemistry",
    "Physical Chemistry",
    "Thermodynamics",
    "numerical",
    "The work done (in J) when 1 mol of an ideal gas expands isothermally at 300 K from 1 L to 10 L is:",
    "",
    "",
    "",
    "",
    "-5744",
    "4",
    "JEE Advanced 2022",
    "2022",
    "Using $w = -nRT\\ln(V_2/V_1) = -1 \\times 8.314 \\times 300 \\times \\ln(10) = -5744$ J.",
    "",
  ],
]

// ── Props ──────────────────────────────────────────────────────────────────────

type Props = {
  subjects: Subject[]
  chapters: Chapter[]
  topics: Topic[]
  knownTopicNames: Set<string>
}

// ── Root component ─────────────────────────────────────────────────────────────

export function ImportClient({ subjects, chapters, topics, knownTopicNames }: Props) {
  const [activeTab, setActiveTab] = useState<"csv" | "images">("csv")

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import questions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bulk-add questions via CSV (with optional solutions) or image upload. CSV imports can be
          published immediately; image imports always land in <strong>draft</strong>.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        {(
          [
            { key: "csv", label: "CSV Upload", icon: FileText },
            { key: "images", label: "Bulk Images", icon: ImageIcon },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={[
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "csv" ? (
        <CSVTab knownTopicNames={knownTopicNames} />
      ) : (
        <ImagesTab subjects={subjects} chapters={chapters} topics={topics} />
      )}
    </div>
  )
}

// ── CSV Tab ───────────────────────────────────────────────────────────────────

function CSVTab({ knownTopicNames }: { knownTopicNames: Set<string> }) {
  const [rows, setRows] = useState<ValidatedRow[]>([])
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    inserted: number
    skipped: number
    errors: string[]
  } | null>(null)
  const [publishImmediately, setPublishImmediately] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function parseFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file")
      return
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rawRows = result.data as Record<string, string>[]
        const validated: ValidatedRow[] = rawRows.map((raw, i) => {
          const errors: string[] = []
          const required = ["subject", "chapter", "topic", "question_type", "question_text", "correct_answer"]
          for (const f of required) {
            if (!raw[f]?.trim()) errors.push(`${f} is required`)
          }
          const validTypes = ["single_correct", "multi_correct", "numerical", "subjective"]
          if (raw.question_type && !validTypes.includes(raw.question_type)) {
            errors.push(`question_type must be one of: ${validTypes.join(", ")}`)
          }
          const mcqLetters = ["a", "b", "c", "d"]
          if (raw.question_type === "single_correct") {
            if (raw.correct_answer && !mcqLetters.includes(raw.correct_answer.toLowerCase().trim())) {
              errors.push("correct_answer must be a, b, c, or d for single_correct")
            }
          } else if (raw.question_type === "multi_correct") {
            const parts = raw.correct_answer?.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean) ?? []
            if (raw.correct_answer && (parts.length === 0 || parts.some((p) => !mcqLetters.includes(p)))) {
              errors.push("correct_answer must be comma-separated a/b/c/d values for multi_correct")
            }
          } else if (raw.question_type === "numerical") {
            if (raw.correct_answer && isNaN(parseFloat(raw.correct_answer))) {
              errors.push("correct_answer must be a valid number for numerical")
            }
          }
          const diff = parseInt(raw.difficulty, 10)
          if (isNaN(diff) || diff < 1 || diff > 5) {
            errors.push("difficulty must be 1–5")
          }
          // Check topic name against known topics
          const topicKey = [
            raw.subject?.toLowerCase().trim(),
            raw.chapter?.toLowerCase().trim(),
            raw.topic?.toLowerCase().trim(),
          ].join("|")
          if (raw.subject && raw.chapter && raw.topic && !knownTopicNames.has(topicKey)) {
            errors.push(`topic "${raw.topic}" not found in DB`)
          }

          void i
          return {
            subject: raw.subject ?? "",
            chapter: raw.chapter ?? "",
            topic: raw.topic ?? "",
            question_type: raw.question_type ?? "",
            question_text: raw.question_text ?? "",
            option_a: raw.option_a ?? undefined,
            option_b: raw.option_b ?? undefined,
            option_c: raw.option_c ?? undefined,
            option_d: raw.option_d ?? undefined,
            correct_answer: raw.correct_answer ?? "",
            difficulty: diff || 3,
            source: raw.source || undefined,
            year: raw.year ? parseInt(raw.year, 10) : undefined,
            standard_solution: raw.standard_solution?.trim() || undefined,
            shortcut_solution: raw.shortcut_solution?.trim() || undefined,
            _valid: errors.length === 0,
            _error: errors.join("; "),
          }
        })
        setRows(validated)
        setResult(null)
        toast.success(`Parsed ${validated.length} rows`)
      },
      error: () => toast.error("Failed to parse CSV"),
    })
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) parseFile(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [knownTopicNames]
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  function handleImport() {
    const validRows = rows.filter((r) => r._valid)
    if (validRows.length === 0) {
      toast.error("No valid rows to import")
      return
    }
    startTransition(async () => {
      const res = await importQuestionsFromCSV(validRows as ParsedRow[], publishImmediately)
      if (res.ok) {
        setResult(res.data)
        toast.success(`Imported ${res.data.inserted} questions`)
      } else {
        toast.error(res.error)
      }
    })
  }

  const validCount = rows.filter((r) => r._valid).length
  const validRows = rows.filter((r) => r._valid)
  const withStandardSolution = validRows.filter((r) => r.standard_solution).length
  const withShortcutSolution = validRows.filter((r) => r.shortcut_solution).length

  return (
    <div className="grid gap-6">
      {/* Format docs */}
      <div className="rounded-xl border bg-card p-5 grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">CSV format</h2>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <Download className="size-3.5" />
            Download template
          </Button>
        </div>
        <code className="block rounded-md bg-muted px-3 py-2 text-xs leading-relaxed overflow-x-auto whitespace-nowrap">
          {CSV_HEADERS.join(",")}
        </code>
        <div className="grid gap-1 text-xs text-muted-foreground">
          <p>
            <strong>question_type:</strong> single_correct | multi_correct | numerical | subjective
          </p>
          <p>
            <strong>correct_answer:</strong> option letter (a–d) for MCQ, number for numerical,
            comma-separated letters for multi (e.g. &quot;a,c&quot;)
          </p>
          <p>
            <strong>difficulty:</strong> 1 (easiest) – 5 (hardest)
          </p>
          <p>
            <strong>For numerical questions:</strong> leave option_a–d empty
          </p>
          <p>
            <strong>standard_solution / shortcut_solution:</strong> Optional. LaTeX supported —{" "}
            <code className="bg-muted px-1 rounded">$x^2$</code> inline,{" "}
            <code className="bg-muted px-1 rounded">$$...$$</code> block. If non-empty, a
            published solution is created automatically.
          </p>
        </div>
        <p className="text-xs font-medium text-muted-foreground">Example rows:</p>
        {CSV_EXAMPLE_ROWS.map((row, i) => (
          <code
            key={i}
            className="block rounded-md bg-muted px-3 py-2 text-xs leading-relaxed overflow-x-auto whitespace-nowrap"
          >
            {row.join(",")}
          </code>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:border-primary/50",
        ].join(" ")}
      >
        <Upload className="size-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">Drop a CSV file here</p>
          <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="grid gap-4">
          <div className="grid gap-3">
            <p className="text-sm">
              <strong>{rows.length}</strong> rows parsed —{" "}
              <span className="text-emerald-600">{validCount} valid</span>,{" "}
              <span className="text-destructive">{rows.length - validCount} invalid</span>
            </p>
            {validCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {validCount} question{validCount !== 1 ? "s" : ""},{" "}
                {withStandardSolution} with standard solution,{" "}
                {withShortcutSolution} with shortcut solution
              </p>
            )}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="rounded border-input accent-primary size-4 cursor-pointer"
                />
                Publish questions immediately
              </label>
              <Button
                onClick={handleImport}
                disabled={isPending || validCount === 0}
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Importing…
                  </>
                ) : (
                  <>
                    <Upload className="size-4" /> Import {validCount} valid questions
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted text-left">
                  <th className="px-3 py-2 font-medium w-8">#</th>
                  <th className="px-3 py-2 font-medium w-8"></th>
                  <th className="px-3 py-2 font-medium">Subject / Chapter / Topic</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium max-w-[300px]">Question</th>
                  <th className="px-3 py-2 font-medium">Answer</th>
                  <th className="px-3 py-2 font-medium">Diff</th>
                  <th className="px-3 py-2 font-medium">Std Solution</th>
                  <th className="px-3 py-2 font-medium">Shortcut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={[
                      "border-b last:border-0",
                      row._valid ? "" : "bg-destructive/5",
                    ].join(" ")}
                  >
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2">
                      {row._valid ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <span title={row._error}>
                          <XCircle className="size-4 text-destructive" />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div>{row.subject}</div>
                      <div className="text-muted-foreground">
                        {row.chapter} › {row.topic}
                      </div>
                      {!row._valid && (
                        <div className="text-destructive mt-0.5">{row._error}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.question_type}</td>
                    <td className="px-3 py-2 max-w-[300px] truncate">{row.question_text}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.correct_answer}</td>
                    <td className="px-3 py-2">{row.difficulty}</td>
                    <td className="px-3 py-2 text-center">
                      {row.standard_solution ? (
                        <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.shortcut_solution ? (
                        <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import result */}
      {result && (
        <div className="rounded-xl border bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            Imported {result.inserted} questions.{" "}
            {result.skipped > 0 && `${result.skipped} skipped.`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 grid gap-1 text-xs text-destructive list-disc pl-4">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── Images Tab ─────────────────────────────────────────────────────────────────

function ImagesTab({
  subjects,
  chapters,
  topics,
}: {
  subjects: Subject[]
  chapters: Chapter[]
  topics: Topic[]
}) {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedChapter, setSelectedChapter] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [questionType, setQuestionType] = useState("single_correct")
  const [optionCount, setOptionCount] = useState(4)
  const [files, setFiles] = useState<File[]>([])
  const [isPending, startTransition] = useTransition()
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredChapters = chapters.filter((c) => c.subject_id === selectedSubject)
  const filteredTopics = topics.filter((t) => t.chapter_id === selectedChapter)

  function handleFiles(incoming: FileList) {
    const imgs = Array.from(incoming).filter((f) => f.type.startsWith("image/"))
    if (imgs.length < incoming.length) toast.error("Only image files are accepted")
    setFiles((prev) => [...prev, ...imgs])
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleImport() {
    if (!selectedTopic) { toast.error("Select a topic first"); return }
    if (files.length === 0) { toast.error("Upload at least one image"); return }

    startTransition(async () => {
      const urls: string[] = []
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading image ${i + 1}/${files.length}…`)
        try {
          const url = await uploadContentImage(files[i], "questions")
          urls.push(url)
        } catch (err) {
          toast.error(`Failed to upload ${files[i].name}: ${err instanceof Error ? err.message : "unknown error"}`)
        }
      }
      setUploadProgress("Creating draft questions…")

      const metadata: ImageImportMetadata = {
        topicId: selectedTopic,
        questionType,
        optionCount,
      }
      const res = await importQuestionsFromImages(urls, metadata)
      setUploadProgress(null)
      if (res.ok) {
        toast.success(`Created ${res.data.inserted} draft questions`)
        setFiles([])
      } else {
        toast.error(res.error)
      }
    })
  }

  const showOptions = questionType === "single_correct" || questionType === "multi_correct"

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border bg-card p-5 grid gap-4">
        <p className="text-sm text-muted-foreground">
          Upload multiple scanned question images at once. Each image becomes a draft question
          with the selected taxonomy and answer format. You&apos;ll mark correct answers and add
          solutions one by one from the Questions table.
        </p>

        {/* Taxonomy selectors */}
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Subject"
            value={selectedSubject}
            onChange={(v) => { setSelectedSubject(v); setSelectedChapter(""); setSelectedTopic("") }}
            options={[
              { value: "", label: "— Select subject —" },
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          <SelectField
            label="Chapter"
            value={selectedChapter}
            onChange={(v) => { setSelectedChapter(v); setSelectedTopic("") }}
            disabled={!selectedSubject}
            options={[
              { value: "", label: "— Select chapter —" },
              ...filteredChapters.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <SelectField
            label="Topic"
            value={selectedTopic}
            onChange={setSelectedTopic}
            disabled={!selectedChapter}
            options={[
              { value: "", label: "— Select topic —" },
              ...filteredTopics.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Question type"
            value={questionType}
            onChange={setQuestionType}
            options={[
              { value: "single_correct", label: "Single correct (MCQ)" },
              { value: "multi_correct", label: "Multi correct" },
              { value: "numerical", label: "Numerical" },
              { value: "subjective", label: "Subjective" },
            ]}
          />
          {showOptions && (
            <SelectField
              label="Number of options"
              value={String(optionCount)}
              onChange={(v) => setOptionCount(parseInt(v, 10))}
              options={[
                { value: "4", label: "4 options" },
                { value: "5", label: "5 options" },
                { value: "6", label: "6 options" },
              ]}
            />
          )}
        </div>
      </div>

      {/* Image upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/30 p-10 hover:border-primary/50 transition-colors"
      >
        <Upload className="size-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">Drop images here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            PNG, JPG, WebP — select multiple files at once
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files) }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="grid gap-3">
          <p className="text-sm font-medium">{files.length} image{files.length > 1 ? "s" : ""} selected</p>
          <div className="grid gap-2 max-h-64 overflow-y-auto rounded-xl border p-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{f.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                  className="text-muted-foreground hover:text-destructive p-1"
                >
                  <XCircle className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleImport}
            disabled={isPending || !selectedTopic}
            className="w-full gap-2 min-h-[48px]"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {uploadProgress ?? "Importing…"}
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Create {files.length} draft question{files.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border bg-background px-3 text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function downloadTemplate() {
  const csv = Papa.unparse([CSV_HEADERS, ...CSV_EXAMPLE_ROWS])
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "jee-questions-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}
