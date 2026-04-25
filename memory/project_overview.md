---
name: Project overview and patterns
description: Key patterns, type quirks, and architectural decisions for the JEE platform
type: project
---

Next.js 14 App Router, Supabase (SSR), Tailwind v4, shadcn/ui (base-ui), React 18.

**Critical type pattern**: Supabase client uses PostgrestVersion "14.5" with `RejectExcessProperties` — do NOT pass `Record<string, unknown>` to `.update()`. Pass a typed object literal directly.

**Correct answer type**: Insert `correct_answer` into `questions` as `Json` (import from `@/lib/types/database.types`), not `unknown`.

**Select in forms**: Use native `<select>` elements (not shadcn Select from base-ui) when values must serialize into FormData for server actions. Base-ui Select may not expose a `name` attribute.

**Server action pattern**: Use `useTransition` + manual state for server actions in client components (not `useFormState`) — avoids React 18 API compatibility issues.

**Key files**:
- `app/(dashboard)/settings/` — Settings page (profile, password, data sections)
- `app/(admin)/admin/import/` — Bulk CSV + image import for questions
- `components/admin/admin-top-bar.tsx` — Admin nav (add new routes here)
- `lib/supabase/storage.ts` — `uploadContentImage(file, folder)` for browser uploads

**Why:** Maintains architectural consistency and avoids TypeScript errors from Supabase's strict types.
**How to apply:** Always check existing action files (especially `app/(admin)/admin/questions/actions.ts`) as the reference pattern for new admin mutations.
