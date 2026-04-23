"use client"

import { useRef } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MathPreview } from "@/components/math-preview"

type Snippet = {
  label: string
  insert: string
  /** Where to place the cursor after insert, relative to start of inserted text. */
  cursorOffset?: number
  /** Number of characters to select after insert (placeholder selection). */
  selectLen?: number
}

const SNIPPETS: Snippet[] = [
  { label: "Inline $x$", insert: "$x$", cursorOffset: 1, selectLen: 1 },
  { label: "Block $$", insert: "$$\n\n$$", cursorOffset: 3 },
  { label: "Fraction", insert: "\\frac{a}{b}", cursorOffset: 6, selectLen: 1 },
  { label: "Sqrt", insert: "\\sqrt{x}", cursorOffset: 6, selectLen: 1 },
  { label: "Power", insert: "x^{n}", cursorOffset: 3, selectLen: 1 },
  { label: "Subscript", insert: "x_{n}", cursorOffset: 3, selectLen: 1 },
  { label: "Integral", insert: "\\int", cursorOffset: 4 },
  { label: "Sum", insert: "\\sum", cursorOffset: 4 },
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
  /**
   * Compact mode uses a smaller toolbar and shrinks the preview — intended
   * for nested editors (e.g. MCQ options).
   */
  compact?: boolean
  className?: string
}

export function MathEditor({
  value,
  onChange,
  label,
  placeholder,
  minHeight = 120,
  id,
  name,
  onBlur,
  disabled,
  compact,
  className,
}: MathEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null)

  const insertAtCursor = (snippet: Snippet) => {
    const ta = taRef.current
    if (!ta) {
      onChange(value + snippet.insert)
      return
    }
    const start = ta.selectionStart ?? value.length
    const end = ta.selectionEnd ?? value.length
    const next = value.slice(0, start) + snippet.insert + value.slice(end)
    onChange(next)
    // Restore focus + place cursor/selection inside the snippet on next tick.
    requestAnimationFrame(() => {
      ta.focus()
      const caret = start + (snippet.cursorOffset ?? snippet.insert.length)
      const selEnd = caret + (snippet.selectLen ?? 0)
      ta.setSelectionRange(caret, selEnd)
    })
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}

      <div className="flex flex-wrap gap-1 rounded-md border bg-muted/30 p-1">
        {SNIPPETS.map((s) => (
          <Button
            key={s.label}
            type="button"
            variant="ghost"
            size={compact ? "xs" : "sm"}
            disabled={disabled}
            onClick={() => insertAtCursor(s)}
            className="font-mono"
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Textarea
          ref={taRef}
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          spellCheck={false}
          className="font-mono text-sm leading-relaxed"
          style={{ minHeight }}
        />
        <div
          className="overflow-auto rounded-md border bg-background p-3"
          style={{ minHeight }}
        >
          {value.trim() === "" ? (
            <p className="text-sm text-muted-foreground">
              Live preview — write LaTeX inside <code>$...$</code> or{" "}
              <code>$$...$$</code>.
            </p>
          ) : (
            <MathPreview value={value} />
          )}
        </div>
      </div>
    </div>
  )
}
