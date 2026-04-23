"use client"

import { useMemo } from "react"
import katex from "katex"

import { cn } from "@/lib/utils"

type Segment =
  | { kind: "text"; value: string }
  | { kind: "inline"; value: string }
  | { kind: "block"; value: string }

// Tokenize a string into text / inline-math / block-math segments.
// Order matters: scan for $$...$$ first, then $...$, escaping \$ literals.
function tokenize(input: string): Segment[] {
  const out: Segment[] = []
  let i = 0
  const len = input.length
  while (i < len) {
    if (input[i] === "\\" && input[i + 1] === "$") {
      // Literal dollar sign.
      out.push({ kind: "text", value: "$" })
      i += 2
      continue
    }
    if (input[i] === "$" && input[i + 1] === "$") {
      const end = input.indexOf("$$", i + 2)
      if (end === -1) {
        out.push({ kind: "text", value: input.slice(i) })
        break
      }
      out.push({ kind: "block", value: input.slice(i + 2, end) })
      i = end + 2
      continue
    }
    if (input[i] === "$") {
      const end = input.indexOf("$", i + 1)
      if (end === -1) {
        out.push({ kind: "text", value: input.slice(i) })
        break
      }
      out.push({ kind: "inline", value: input.slice(i + 1, end) })
      i = end + 1
      continue
    }
    // Plain text run until next $ or \$
    let j = i
    while (j < len && input[j] !== "$" && !(input[j] === "\\" && input[j + 1] === "$")) {
      j++
    }
    out.push({ kind: "text", value: input.slice(i, j) })
    i = j
  }
  return out
}

type RenderedSegment =
  | { kind: "text"; value: string }
  | { kind: "math"; html: string; display: boolean }
  | { kind: "error"; raw: string; message: string }

function render(input: string): RenderedSegment[] {
  return tokenize(input).map((seg): RenderedSegment => {
    if (seg.kind === "text") return seg
    try {
      const html = katex.renderToString(seg.value, {
        displayMode: seg.kind === "block",
        throwOnError: true,
        strict: "ignore",
        trust: false,
      })
      return { kind: "math", html, display: seg.kind === "block" }
    } catch (err) {
      const raw = seg.kind === "block" ? `$$${seg.value}$$` : `$${seg.value}$`
      const message = err instanceof Error ? err.message : "KaTeX error"
      return { kind: "error", raw, message }
    }
  })
}

type MathPreviewProps = {
  value: string
  className?: string
  /**
   * When true, split content on newlines and render each line on its own row.
   * When false (default), render inline so flow text and math interleave.
   */
  block?: boolean
}

export function MathPreview({ value, className, block = true }: MathPreviewProps) {
  const lines = useMemo(() => {
    if (!block) return [value]
    return value.split(/\r?\n/)
  }, [value, block])

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none break-words text-foreground leading-relaxed [&_.katex]:text-inherit",
        className
      )}
    >
      {lines.map((line, idx) => {
        if (line.trim() === "") {
          return <div key={idx} className="h-4" aria-hidden />
        }
        const segs = render(line)
        return (
          <div key={idx} className="[&>*]:align-middle">
            {segs.map((s, sIdx) => {
              if (s.kind === "text") {
                return <span key={sIdx}>{s.value}</span>
              }
              if (s.kind === "math") {
                return (
                  <span
                    key={sIdx}
                    className={s.display ? "block my-2" : "inline"}
                    dangerouslySetInnerHTML={{ __html: s.html }}
                  />
                )
              }
              return (
                <span
                  key={sIdx}
                  className="rounded bg-destructive/10 px-1 font-mono text-xs text-destructive"
                  title={s.message}
                >
                  {s.raw}
                </span>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// Truncated single-line preview for list/table cells. Strips newlines and caps length.
export function MathInlinePreview({
  value,
  maxChars = 80,
  className,
}: {
  value: string
  maxChars?: number
  className?: string
}) {
  const flattened = value.replace(/\r?\n/g, " ").trim()
  const truncated =
    flattened.length > maxChars ? flattened.slice(0, maxChars) + "…" : flattened
  return (
    <MathPreview
      value={truncated}
      block={false}
      className={cn("text-sm", className)}
    />
  )
}
