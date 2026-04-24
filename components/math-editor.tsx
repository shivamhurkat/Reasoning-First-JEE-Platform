"use client"

import { useRef } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MathPreview } from "@/components/math-preview"

/**
 * Slot convention: the two-character token "{ }" (brace-space-brace) marks an
 * empty placeholder. The inline equivalent is "$ $". insertMathSnippet() lands
 * the caret on the first slot and selects its single space, so the user can
 * immediately type over it. Tab / Shift-Tab navigates between slots.
 *
 * Why this token? "{ }" is valid LaTeX (renders as empty) so the preview keeps
 * working mid-edit, and the regex for it is unambiguous in normal JEE math.
 */
const SLOT_RE = /\{ \}|\$ \$/g

/** Finds the next empty slot starting at or after `from`. Returns the range of
 *  the single inner space so setSelectionRange() highlights it. */
function findNextSlot(
  text: string,
  from: number
): { start: number; end: number } | null {
  SLOT_RE.lastIndex = from
  const m = SLOT_RE.exec(text)
  if (!m) return null
  return { start: m.index + 1, end: m.index + 2 }
}

/** Finds the last slot strictly before `from`. Used by Shift+Tab. */
function findPrevSlot(
  text: string,
  from: number
): { start: number; end: number } | null {
  SLOT_RE.lastIndex = 0
  let last: { start: number; end: number } | null = null
  let m: RegExpExecArray | null
  while ((m = SLOT_RE.exec(text)) !== null) {
    const slot = { start: m.index + 1, end: m.index + 2 }
    if (slot.end > from) break
    last = slot
  }
  return last
}

type Snippet = {
  id: string
  label: React.ReactNode
  hint: string
  /** LaTeX string. Use "{ }" for slots and "$ $" for an empty inline wrapper. */
  latex: string
  /** `inline` wraps selection in $...$; `slot` puts selection into the first {} slot. */
  wrap?: "inline" | "slot"
}

const SNIPPETS: Snippet[] = [
  {
    id: "inline",
    label: "Inline",
    hint: "Inline math. Wraps your selection, or inserts $ $ (⌘M)",
    latex: "$ $",
    wrap: "inline",
  },
  {
    id: "block",
    label: "Block",
    hint: "Display math on its own line",
    latex: "\n$$\n \n$$\n",
    wrap: "slot",
  },
  {
    id: "frac",
    label: "a⁄b",
    hint: "Fraction · \\frac{ }{ }",
    latex: "\\frac{ }{ }",
    wrap: "slot",
  },
  {
    id: "sqrt",
    label: "√",
    hint: "Square root · \\sqrt{ }",
    latex: "\\sqrt{ }",
    wrap: "slot",
  },
  {
    id: "pow",
    label: "x²",
    hint: "Power · ^{ }",
    latex: "^{ }",
  },
  {
    id: "sub",
    label: "x₂",
    hint: "Subscript · _{ }",
    latex: "_{ }",
  },
  {
    id: "int",
    label: "∫",
    hint: "Definite integral · \\int_{ }^{ } f(x)\\,dx",
    latex: "\\int_{ }^{ } f(x)\\,dx",
  },
  {
    id: "sum",
    label: "∑",
    hint: "Summation · \\sum_{ }^{ }",
    latex: "\\sum_{ }^{ }",
  },
  {
    id: "lim",
    label: "lim",
    hint: "Limit · \\lim_{x \\to 0}",
    latex: "\\lim_{x \\to 0}",
  },
  {
    id: "vec",
    label: "v⃗",
    hint: "Vector · \\vec{ }",
    latex: "\\vec{ }",
    wrap: "slot",
  },
  {
    id: "pm",
    label: "±",
    hint: "Plus/minus",
    latex: "\\pm ",
  },
  {
    id: "deg",
    label: "°",
    hint: "Degree symbol",
    latex: "^{\\circ}",
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

  /**
   * Reusable insert helper. Splices `snippet` at the current cursor, honours
   * `wrap` (inline → wraps in $...$, slot → drops selection into first {}),
   * and leaves the caret highlighted on the first remaining slot so the user
   * can just start typing.
   */
  function insertMathSnippet(
    snippet: string,
    opts?: { wrap?: "inline" | "slot" }
  ) {
    const ta = taRef.current
    const start = ta?.selectionStart ?? value.length
    const end = ta?.selectionEnd ?? value.length
    const selected = value.slice(start, end)

    let insert = snippet
    if (selected) {
      if (opts?.wrap === "inline") {
        insert = snippet.replace("$ $", `$${selected}$`)
      } else if (opts?.wrap === "slot") {
        insert = snippet.replace("{ }", `{${selected}}`)
      }
    }

    const next = value.slice(0, start) + insert + value.slice(end)
    onChange(next)

    requestAnimationFrame(() => {
      const ta2 = taRef.current
      if (!ta2) return
      ta2.focus()
      // Prefer the first empty slot inside what we just inserted.
      const insertedEnd = start + insert.length
      const slot = findNextSlot(next, start)
      if (slot && slot.end <= insertedEnd) {
        ta2.setSelectionRange(slot.start, slot.end)
      } else {
        ta2.setSelectionRange(insertedEnd, insertedEnd)
      }
    })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // ⌘M / Ctrl+M → wrap selection in inline math.
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
      e.preventDefault()
      insertMathSnippet("$ $", { wrap: "inline" })
      return
    }
    // Tab / Shift+Tab → jump between {} slots. If there's no further slot we
    // let the default behavior happen (move focus out of the editor).
    if (e.key === "Tab") {
      const ta = taRef.current
      if (!ta) return
      const from = e.shiftKey ? (ta.selectionStart ?? 0) : (ta.selectionEnd ?? 0)
      const slot = e.shiftKey
        ? findPrevSlot(value, from)
        : findNextSlot(value, from)
      if (slot) {
        e.preventDefault()
        ta.setSelectionRange(slot.start, slot.end)
      }
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
            onClick={() => insertMathSnippet(s.latex, { wrap: s.wrap })}
            title={s.hint}
            className="font-medium"
          >
            {s.label}
          </Button>
        ))}
        <span className="ml-auto hidden pr-1.5 text-[10px] text-muted-foreground sm:inline">
          Tab jumps between{" "}
          <code className="rounded bg-background px-1 py-px font-mono text-[10px]">
            {"{ }"}
          </code>{" "}
          slots · ⌘M wraps selection
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
            "Type math. Use $x^2$ for inline, $$…$$ for a block. Toolbar inserts { } placeholders — fill them with Tab."
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
              Rendered math appears here. Example:{" "}
              <span className="font-mono">$a^2 + b^2 = c^2$</span>
            </p>
          ) : (
            <MathPreview value={value} />
          )}
        </div>
      </div>
    </div>
  )
}
