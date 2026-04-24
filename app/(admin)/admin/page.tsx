import Link from "next/link"
import {
  BookOpen,
  CheckCircle2,
  FileEdit,
  Flag,
  FolderTree,
  Layers,
  PlusCircle,
  Sparkles,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const dynamic = "force-dynamic"

async function countTable(
  supabase: ReturnType<typeof createClient>,
  table: "questions" | "solutions" | "subjects" | "chapters" | "topics",
  filters?: Record<string, string>
) {
  let q = supabase.from(table).select("*", { count: "exact", head: true })
  for (const [k, v] of Object.entries(filters ?? {})) q = q.eq(k, v)
  const { count } = await q
  return count ?? 0
}

export default async function AdminDashboardPage() {
  const supabase = createClient()

  const [
    qDraft,
    qPublished,
    qFlagged,
    qArchived,
    solutionsCount,
    subjectsCount,
    chaptersCount,
    topicsCount,
  ] = await Promise.all([
    countTable(supabase, "questions", { status: "draft" }),
    countTable(supabase, "questions", { status: "published" }),
    countTable(supabase, "questions", { status: "flagged" }),
    countTable(supabase, "questions", { status: "archived" }),
    countTable(supabase, "solutions"),
    countTable(supabase, "subjects"),
    countTable(supabase, "chapters"),
    countTable(supabase, "topics"),
  ])

  const questionsTotal = qDraft + qPublished + qFlagged + qArchived
  const curriculumReady = subjectsCount > 0 && topicsCount > 0

  // Recent activity: last 5 questions authored
  const { data: recent } = await supabase
    .from("questions")
    .select(
      "id, question_text, status, created_at, topics(name, chapters(name, subjects(name)))"
    )
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Content ingestion, review, and curriculum health.
        </p>
      </div>

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={FileEdit}
          label="Draft questions"
          value={qDraft}
          tone="muted"
          href="/admin/questions?status=draft"
        />
        <Kpi
          icon={CheckCircle2}
          label="Published"
          value={qPublished}
          tone="success"
          href="/admin/questions?status=published"
        />
        <Kpi
          icon={Flag}
          label="Flagged"
          value={qFlagged}
          tone="destructive"
          href="/admin/questions?status=flagged"
        />
        <Kpi
          icon={Layers}
          label="Total solutions"
          value={solutionsCount}
          tone="primary"
        />
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Jump in
            </CardTitle>
            <CardDescription>
              The two things you&apos;ll do most days.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button render={<Link href="/admin/questions/new" />}>
              <PlusCircle /> Author a question
            </Button>
            <Button
              render={<Link href="/admin/questions?status=draft" />}
              variant="outline"
            >
              <FileEdit /> Triage drafts ({qDraft})
            </Button>
            <Button
              render={<Link href="/admin/questions?status=flagged" />}
              variant="outline"
            >
              <Flag /> Review flagged ({qFlagged})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderTree className="size-4" />
              Curriculum
            </CardTitle>
            <CardDescription>
              {curriculumReady
                ? `${subjectsCount} subjects · ${chaptersCount} chapters · ${topicsCount} topics`
                : "No curriculum yet — seed it to start authoring."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              render={<Link href="/admin/subjects" />}
              variant={curriculumReady ? "outline" : "default"}
            >
              <FolderTree /> Manage curriculum
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Recent activity */}
      <section className="grid gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent questions
          </h2>
          <Link
            href="/admin/questions"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all ({questionsTotal})
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <div className="grid gap-2">
            {recent.map((r) => {
              const t = (r as { topics?: { name: string; chapters?: { name: string; subjects?: { name: string } | null } | null } | null }).topics
              const trail = [
                t?.chapters?.subjects?.name,
                t?.chapters?.name,
                t?.name,
              ]
                .filter(Boolean)
                .join(" › ")
              const preview = r.question_text.replace(/\r?\n/g, " ").slice(0, 110)
              return (
                <Link
                  key={r.id}
                  href={`/admin/questions/${r.id}/solutions`}
                  className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{preview}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {trail || "Unlinked topic"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      r.status === "published"
                        ? "default"
                        : r.status === "flagged"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {r.status}
                  </Badge>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No questions yet. Click{" "}
            <strong>Author a question</strong> to start.
          </div>
        )}
      </section>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  tone: "muted" | "primary" | "success" | "destructive"
  href?: string
}) {
  const toneClass = {
    muted: "text-muted-foreground",
    primary: "text-primary",
    success: "text-emerald-600",
    destructive: "text-destructive",
  }[tone]

  const body = (
    <Card
      className={cn(
        "transition-all",
        href && "hover:border-primary/40 hover:shadow-sm"
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn("mt-1 text-2xl font-semibold", toneClass)}>{value}</p>
        </div>
        <Icon className={cn("size-5 shrink-0", toneClass)} />
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{body}</Link> : body
}
