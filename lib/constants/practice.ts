import type { LucideIcon } from "lucide-react"
import {
  Calculator,
  ListX,
  Sigma,
  SkipForward,
  Sparkles,
  Zap,
} from "lucide-react"

export type ApproachId =
  | "full_solve"
  | "elimination"
  | "pattern"
  | "shortcut"
  | "skip"

export const APPROACHES: Array<{
  id: ApproachId
  label: string
  blurb: string
  icon: LucideIcon
  shortcut: string
}> = [
  {
    id: "full_solve",
    label: "Full Solve",
    blurb: "Work it out step by step",
    icon: Calculator,
    shortcut: "1",
  },
  {
    id: "elimination",
    label: "Elimination",
    blurb: "Rule out wrong options",
    icon: ListX,
    shortcut: "2",
  },
  {
    id: "pattern",
    label: "Pattern Recognition",
    blurb: "I've seen this before",
    icon: Sparkles,
    shortcut: "3",
  },
  {
    id: "shortcut",
    label: "Shortcut / Trick",
    blurb: "I know a faster method",
    icon: Zap,
    shortcut: "4",
  },
  {
    id: "skip",
    label: "Skip",
    blurb: "I don't know / not sure",
    icon: SkipForward,
    shortcut: "5",
  },
]

export type SolutionType =
  | "standard"
  | "logical"
  | "elimination"
  | "shortcut"
  | "pattern"
  | "trap_warning"

// Display order of tabs on the result screen.
export const SOLUTION_TYPE_ORDER: SolutionType[] = [
  "standard",
  "logical",
  "elimination",
  "shortcut",
  "pattern",
  "trap_warning",
]

export const SOLUTION_TYPE_LABELS: Record<SolutionType, string> = {
  standard: "Standard",
  logical: "Logical",
  elimination: "Elimination",
  shortcut: "Shortcut",
  pattern: "Pattern",
  trap_warning: "Traps",
}

// Which solution_type best matches each approach — used to highlight the
// "Your approach" tab on the result screen.
export const APPROACH_TO_SOLUTION: Record<ApproachId, SolutionType> = {
  full_solve: "standard",
  elimination: "elimination",
  pattern: "pattern",
  shortcut: "shortcut",
  skip: "standard",
}

// Subject slugs used for icon + gradient lookup on the landing.
export const SUBJECT_THEMES: Record<
  string,
  { gradient: string; ring: string; icon: LucideIcon; iconBg: string }
> = {
  physics: {
    gradient:
      "from-sky-500/15 via-blue-500/10 to-transparent dark:from-sky-500/10 dark:via-blue-500/5",
    ring: "hover:border-sky-500/40",
    icon: Sigma, // actual icon imported below via slug→component map
    iconBg: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
  chemistry: {
    gradient:
      "from-emerald-500/15 via-teal-500/10 to-transparent dark:from-emerald-500/10 dark:via-teal-500/5",
    ring: "hover:border-emerald-500/40",
    icon: Sigma,
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  mathematics: {
    gradient:
      "from-violet-500/15 via-fuchsia-500/10 to-transparent dark:from-violet-500/10 dark:via-fuchsia-500/5",
    ring: "hover:border-violet-500/40",
    icon: Sigma,
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  },
}
