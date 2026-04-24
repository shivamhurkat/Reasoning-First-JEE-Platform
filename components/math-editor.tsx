"use client"

import { useRef } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MathPreview } from "@/components/math-preview"

/**
 * A snippet describes one toolbar button. Two patterns:
 *
 * 1. `wrap` — when the user has text selected, wrap it with `before` + selection + `after`.
 *    If nothing is selected, insert `before` + `placeholder` + `after` and leave the
 *    placeholder selected so the user can type over it.
 *
 * 2. `template` — insert a fixed multi-line template. `cursor` says where the caret should
 *    land (character offset from start of inserted text).
 */
type Snippet = {
  id: string
  label: string
  hint: string
} & (
  | {
      kind: "wrap"
      before: string
      after: string
      placeholder: string
    }
  | {
      kind: "template"
      text: string
      cursor: number
      selectLen?: number
    }
)

const SNIPPETS: Snippet[] = [
  {
    id: "inline",
    kind: "wrap",
    label: "Inline $…$",
    hint: "Inline math. Wraps your selection in $...$",
    before: "$",
    after: "$",
    placeholder: "x",
  },
  {
    id: "block",
    kind: "template",
    label: "Block $$…$$",
    hint: "Display math on its own line",
    text: "\n$$\n\n$$\n",
    cursor: 4,
  },
  {
    id: "frac",
    kind: "wrap",
    label: "a/b",
    hint: "Fraction \\frac{a}{b}",
    before: "\\frac{",
    after: "}{b}",
    placeholder: "a",
  },
  {
    id: "sqrt",
    kind: "wrap",
    label: "√",
    hint: "Square root \\sqrt{x}",
    before: "\\sqrt{",
    after: "}",
    placeholder: "x",
  },
  {
    id: "pow",
    kind: "wrap",
    label: "xⁿ",
    hint: "Power x^{n}",
    before: "",
    after: "^{n}",
    placeholder: "x",
  },
  {
    id: "sub",
    kind: "wrap",
    label: "xₙ",
    hint: "Subscript x_{n}",
    before: "",
    after: "_{n}",
    placeholder: "x",
  },
  {
    id: "int",
    kind: "template",
    label: "∫",
    hint: "Definite integral",
    text: "\\int_{a}^{b} f(x)\\,dx",
    cursor: 6, // caret inside {a}
    selectLen: 1,
  },
  {
    id: "sum",
    kind: "template",
    label: "Σ",
    hint: "Summation",
    text: "\\sum_{n=1}^{\\infty}",
    cursor: 6, // inside first {}
    selectLen: 3,
  },
  {
    id: "lim",
    kind: "template",
    label: "lim",
    hint: "Limit",
    text: "\\lim_{x \\to 0}",
    cursor: 6,
    selectLen: 1,
  },
  {
    id: "vec",
    kind: "wrap",
    label: "→v",
    hint: "Vector \\vec{v}",
    before: "\\vec{",
    after: "}",
    placeholder: "v",
  },
  {
    id: "deg",
    kind: "template",
    label: "°",
    hint: "Degree symbol",
    text: "^{\\circ}",
    cursor: 8,
  },
  {
    id: "pm",
    kind: "template",
    label: "±",
    hint: "Plus/minus",
    text: "\\pm ",
    cursor: 4,
  },
]

export type MathEditorProps = {
  value: string
  onChange: (next: string) => void
  label?: string
  placeholder?: string
  minHeight?: number
  id?: string
  name?: string
  onBlur?: () => void
  disabled?: boolean
  compact?: boolean
  className?: string
}

export function MathEditor({
  value,
  onChange,
  label,
  placeholder,
  minHeight = 140,
  id,
  name,
  onBlur,
  disabled,
  compact,
  className,
}: MathEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null)

  const applySnippet = (s: Snippet) => {
    const ta = taRef.current
    const start = ta?.selectionStart ?? value.length
    const end = ta?.selectionEnd ?? value.length
    const selected = value.slice(start, end)

    let insert = ""
    let caret = start
    let selEnd = start

    if (s.kind === "wrap") {
      const body = selected.length > 0 ? selected : s.placeholder
      insert = s.before + body + s.after
      // Highlight the body so the user can immediately type over it.
      caret = start + s.before.length
      selEnd = caret + body.length
    } else {
      insert = s.text
      caret = start + s.cursor
      selEnd = caret + (s.selectLen ?? 0)
    }

    const next = value.slice(0, start) + insert + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      const ta2 = taRef.current
      if (!ta2) return
      ta2.focus()
      ta2.setSelectionRange(caret, selEnd)
    })
  }

  // Ctrl/Cmd+M toggles an inline math wrapper around the current selection.
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
      e.preventDefault()
      applySnippet(SNIPPETS[0]) // inline
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}

      <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/40 p-1">
        {SNIPPETS.map((s) => (
          <Button
            key={s.id}
            type="button"
            variant="ghost"
            size={compact ? "xs" : "sm"}
            disabled={disabled}
            onClick={() => applySnippet(s)}
            title={s.hint}
            className="font-medium"
          >
            {s.label}
          </Button>
        ))}
        <span className="ml-auto hidden pr-1.5 text-[10px] text-muted-foreground sm:inline">
          ⌘M wraps selection in $…$
        </span>
      </div>

      <div className={cn("grid gap-3", compact ? "" : "md:grid-cols-2")}>
        <Textarea
          ref={taRef}
          id={id}
          name={name}
          value={value}
          placeholder={
            placeholder ??
            "Type here. Use $x^2$ for inline math, $$…$$ for a block. Toolbar buttons wrap your selection."
          }
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          spellCheck={false}
          className="font-mono text-sm leading-relaxed"
          style={{ minHeight }}
        />
        <div
          className="overflow-auto rounded-md border bg-background p-3"
          style={{ minHeight }}
        >
          {value.trim() === "" ? (
            <p className="text-xs text-muted-foreground">
              Preview appears here.{" "}
              <span className="font-mono">$a^2 + b^2 = c^2$</span> renders as math.
            </p>
          ) : (
            <MathPreview value={value} />
          )}
        </div>
      </div>
    </div>
  )
}
