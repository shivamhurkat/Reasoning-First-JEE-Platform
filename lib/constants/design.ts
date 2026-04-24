// CSS custom-property names for the ReasonLab design system.
// Actual values live in app/globals.css under :root {}.
// Usage in JSX: style={{ color: `var(${TOKENS.brandPrimary})` }}
// Usage in Tailwind: bg-[var(--brand-primary)] or bg-brand-primary (registered in @theme inline)

export const TOKENS = {
  // Brand — deep JEE-indigo
  brandPrimary: "--brand-primary",
  brandPrimaryLight: "--brand-primary-light",
  brandPrimaryDark: "--brand-primary-dark",
  // Accent — warm amber (streaks, XP, achievements)
  accentWarm: "--accent-warm",
  // Subject identity colours
  subjectPhysics: "--subject-physics",
  subjectChemistry: "--subject-chemistry",
  subjectMath: "--subject-math",
  // Semantic
  success: "--success",
  error: "--error",
  warning: "--warning",
  info: "--info",
  // Surface
  surfaceGlass: "--surface-glass",   // ONLY on fixed/sticky elements
  surfaceElevated: "--surface-elevated",
} as const

export type DesignToken = (typeof TOKENS)[keyof typeof TOKENS]

// Minimum touch-target size per Apple HIG (44px) and Material (48px).
export const MIN_TOUCH_TARGET = 44

// Minimum input font-size to prevent iOS Safari auto-zoom.
export const MIN_INPUT_FONT_PX = 16
