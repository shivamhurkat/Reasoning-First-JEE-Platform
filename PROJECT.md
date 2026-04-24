# Reasoning-First JEE Platform

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui (base style, neutral base color, CSS variables, Lucide icons)
- **Auth & DB**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Validation**: Zod
- **Forms**: React Hook Form (+ `@hookform/resolvers`)
- **Icons**: lucide-react
- **Toasts**: Sonner
- **Dates**: date-fns
- **AI**: Anthropic Claude API
- **Payments**: Razorpay
- **Email**: Resend
- **Cache / rate limiting**: Upstash Redis (REST)

## Folder Structure

```
.
├── app/
│   ├── (auth)/           # Unauthenticated routes (login, signup, forgot/reset password)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/      # Authenticated student-facing routes
│   │   ├── layout.tsx    # Server guard + AppShell
│   │   ├── page.tsx      # Dashboard home — serves `/`
│   │   ├── practice/page.tsx
│   │   ├── progress/page.tsx
│   │   └── settings/page.tsx
│   ├── (admin)/          # Admin-only routes (not implemented yet)
│   ├── api/              # Route handlers (REST-style endpoints, webhooks)
│   ├── auth/             # Auth plumbing routes (NOT a route group)
│   │   ├── callback/route.ts   # OAuth + email-confirmation code exchange
│   │   └── signout/route.ts    # POST → supabase.auth.signOut → /login
│   ├── layout.tsx        # Root layout (fonts + global Sonner <Toaster />)
│   └── globals.css       # Tailwind v4 + shadcn CSS variables
│
├── components/
│   ├── app-shell.tsx     # Client sidebar + mobile Sheet for (dashboard)
│   └── ui/               # shadcn/ui components (added via `npx shadcn add <name>`)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts     # Browser Supabase client (client components)
│   │   ├── server.ts     # Server Supabase client (server components, route handlers, actions)
│   │   └── middleware.ts # `updateSession` helper for the Next.js middleware
│   ├── utils/            # Shared utilities (includes `cn` for Tailwind class merging)
│   ├── types/            # Shared TypeScript types (domain models, DTOs)
│   └── constants/        # App-wide constants (enums, config values)
│
├── supabase/
│   └── migrations/       # Ordered SQL migration files (0001_init.sql, ...)
│
├── scripts/
│   └── seed-questions.ts # Standalone tsx script: seeds 10 JEE-style questions
│
├── middleware.ts         # Root Next.js middleware — calls Supabase `updateSession`
├── public/               # Static assets
├── .env.local.example    # Template for required env vars (copy to .env.local)
├── components.json       # shadcn/ui config (base-nova style, @base-ui/react primitives)
├── postcss.config.mjs    # Uses @tailwindcss/postcss (Tailwind v4)
├── tsconfig.json
└── next.config.mjs
```

> Tailwind v4 has no `tailwind.config.ts`; theme tokens live in
> `app/globals.css` inside `@theme inline { … }`.

### Route groups

- `(auth)`, `(dashboard)`, `(admin)` are Next.js **route groups** — parentheses mean the segment does not appear in the URL. They exist to scope layouts, auth guards, and navigation to each surface without affecting routing.
- `app/auth/*` (no parens) is **not** a route group. Those paths are real URLs (`/auth/callback`, `/auth/signout`) because they must match Supabase's redirect URLs and form POST targets.

### Routes: public vs protected

| Path | Access | Served by |
| --- | --- | --- |
| `/login` | Public | `app/(auth)/login/page.tsx` |
| `/signup` | Public | `app/(auth)/signup/page.tsx` |
| `/forgot-password` | Public | `app/(auth)/forgot-password/page.tsx` |
| `/reset-password` | Requires reset-session cookie (from email link) | `app/(auth)/reset-password/page.tsx` |
| `/auth/callback` | Public endpoint (Supabase redirect target) | `app/auth/callback/route.ts` |
| `/auth/signout` | POST only; no-op if no session | `app/auth/signout/route.ts` |
| `/` | **Protected** (dashboard home) | `app/(dashboard)/page.tsx` |
| `/practice` | **Protected** (practice landing) | `app/(dashboard)/practice/page.tsx` |
| `/practice/[subject]` | **Protected** (chapter list) | `app/(dashboard)/practice/[subject]/page.tsx` |
| `/practice/[subject]/[chapter]` | **Protected** (topic list) | `app/(dashboard)/practice/[subject]/[chapter]/page.tsx` |
| `/practice/session/[sessionId]` | **Protected** (live session) | `app/(dashboard)/practice/session/[sessionId]/page.tsx` |
| `/practice/session/[sessionId]/summary` | **Protected** (session summary) | `…/summary/page.tsx` |
| `/progress`, `/settings` | **Protected** | `app/(dashboard)/<name>/page.tsx` |
| `/admin/subjects` | **Admin-only** | `app/(admin)/admin/subjects/page.tsx` |
| `/admin/questions` | **Admin-only** | `app/(admin)/admin/questions/page.tsx` |
| `/admin/questions/new` | **Admin-only** | `app/(admin)/admin/questions/new/page.tsx` |
| `/admin/questions/[id]/edit` | **Admin-only** | `app/(admin)/admin/questions/[id]/edit/page.tsx` |
| `/admin/questions/[id]/solutions` | **Admin-only** | `app/(admin)/admin/questions/[id]/solutions/page.tsx` |

Protection is enforced in two server-component layouts:

- `app/(dashboard)/layout.tsx` — redirects to `/login` if no user.
- `app/(admin)/layout.tsx` — redirects to `/login` if no user, to `/` (silently, no toast) if `role !== 'admin'`. Silent redirect avoids leaking that `/admin/*` exists.

The session cookie itself is refreshed on **every** request by the root
`middleware.ts` → `updateSession` helper. Every admin server action also
re-checks role via `adminClient()` — defense in depth so a mis-pointed
client can't call an action directly.

### Auth flow (text diagram)

**Email + password signup**

```
user → /signup  (react-hook-form + zod)
     → supabase.auth.signUp(email, password, { options.data.full_name, emailRedirectTo: /auth/callback })
     → DB trigger on_auth_user_created inserts public.user_profiles row
     → client updates full_name on that row (if provided)
     → toast "Check your email" + redirect /login
user clicks link in email → /auth/callback?code=...
                         → supabase.auth.exchangeCodeForSession(code)
                         → session cookie set; redirect /
```

**Email + password login**

```
user → /login → supabase.auth.signInWithPassword
             → cookie set; router.push('/') + router.refresh()
/              → middleware refreshes session → (dashboard) layout sees user → renders
```

**Google OAuth**

```
user clicks "Continue with Google"
 → supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: /auth/callback })
 → Supabase → Google consent → Supabase → /auth/callback?code=...
 → exchangeCodeForSession → session cookie set; redirect /
```

**Forgot / reset password**

```
/forgot-password → supabase.auth.resetPasswordForEmail(email, redirectTo: /reset-password)
                → always show "if an account exists, you'll get a link" (no enumeration)
user clicks link → lands on /reset-password with a temporary session
                → supabase.auth.updateUser({ password })
                → signOut() + redirect /login
```

**Sign out**

```
sidebar "Sign out" button → <form action="/auth/signout" method="post">
                         → supabase.auth.signOut()
                         → 303 redirect /login
```

### Adding a new protected page

1. Create `app/(dashboard)/<name>/page.tsx`. By being inside the
   `(dashboard)` group, it inherits `app/(dashboard)/layout.tsx` which
   already does the `getUser()` redirect and renders `<AppShell>`.
2. If the page needs data for the signed-in user, `import { createClient }
   from '@/lib/supabase/server'` inside the (async) page component. Call
   `supabase.auth.getUser()` — it's safe to assume non-null here because
   the layout already redirected unauthenticated users.
3. Add a nav link by extending `BASE_NAV` (or the admin branch) in
   `components/app-shell.tsx`. Active-link highlighting is handled via
   `usePathname()`.
4. Public or auth-gated API endpoints live under `app/api/*` — build
   a `route.ts`, validate input with Zod, and call `createClient()` from
   `@/lib/supabase/server` to get a request-scoped client.

## Environment Variables

All required env vars are listed in `.env.local.example`. Copy to `.env.local` for development (`.env.local` is gitignored).

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (safe to expose) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / publishable key (safe to expose, RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key that bypasses RLS — never expose |
| `ANTHROPIC_API_KEY` | Claude API key for reasoning features |
| `RAZORPAY_KEY_ID` | Razorpay public key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret — server-only |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint for rate limiting / caching |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token — server-only |

## Conventions

### Imports

- Use the `@/*` path alias for all internal imports (configured in `tsconfig.json`).
- Group imports: external packages → internal modules → relative imports.

### Supabase usage

- **Client components**: import `createClient` from `@/lib/supabase/client`.
- **Server components, route handlers, server actions**: import `createClient` from `@/lib/supabase/server`.
- **Middleware**: call `updateSession` from `@/lib/supabase/middleware` inside the root `middleware.ts`. This refreshes the session cookie on every request so Server Components see a live auth state.
- **Never** import the service-role key into any `"use client"` file. It is server-only.

### Server vs Client components

- Default to Server Components. Add `"use client"` only when a component needs hooks, event handlers, or browser APIs.
- Data fetching lives in Server Components or route handlers, not in client-side `useEffect`.

### Forms & validation

- Define schemas in Zod; infer types with `z.infer<typeof schema>`.
- Wire forms with React Hook Form using `@hookform/resolvers/zod`.
- Re-use the same Zod schema on the server (route handler or server action) before writing to Supabase.

### shadcn/ui

- Add components with `npx shadcn@latest add <component>`. Components land in `components/ui/`.
- Prefer composing shadcn primitives over writing bespoke components.

### Styling

- Tailwind utility-first. Use the `cn` helper from `@/lib/utils` to merge class names.
- Design tokens live in `app/globals.css` as CSS variables; do not hardcode hex values in components.

### Toasts

- Use Sonner's `toast()` from `sonner`. Mount `<Toaster />` once in the root layout (when UI work begins).

### Dates

- Use `date-fns` for all date formatting and arithmetic. Avoid raw `Date` math.

### API routes

- Under `app/api/<route>/route.ts`. Validate the request body with Zod before touching Supabase.
- Webhooks (Razorpay, Resend, Supabase) verify signatures before processing payloads.

### Types

- Shared domain types go in `lib/types/`. Generated Supabase types (when added) will live alongside them.

### Constants

- Magic strings and numbers used across features go in `lib/constants/`. Feature-local constants stay next to the feature.

## Database Schema

Defined in `supabase/migrations/0001_init.sql`. The TypeScript mirror lives at
`lib/types/database.types.ts` and is imported as the `Database` generic into
every Supabase client.

### Tables (public schema)

| Group | Tables |
| --- | --- |
| Users | `user_profiles` (linked 1:1 to `auth.users` via trigger) |
| Content hierarchy | `subjects` → `chapters` → `topics` |
| Questions & Solutions | `questions` (with pgvector `embedding vector(1536)`), `solutions` |
| Practice | `practice_sessions`, `practice_attempts` |
| Spaced repetition | `review_queue` (SM-2-style ease factor + interval) |
| Daily challenges | `daily_challenges`, `user_daily_challenges` |
| Monetization | `subscriptions`, `payment_transactions` (Razorpay) |
| AI Coach | `coach_conversations` (transcript stored as jsonb) |
| Contributors | `contributor_submissions` (new questions, solutions, corrections) |

### Conventions baked into the schema

- **IDs**: `uuid` PKs with `gen_random_uuid()` defaults, except `user_profiles.id`
  which mirrors `auth.users.id`.
- **Enums**: enforced via `CHECK` constraints on `text` columns (not Postgres
  `ENUM` types) so adding values is cheap. Mirror as string-union types in
  `database.types.ts`.
- **Soft categorization**: `status` columns (`draft`/`published`/`archived`/
  `flagged`) rather than hard deletes.
- **Timestamps**: `created_at` on everything; `updated_at` on `questions` and
  `coach_conversations` with an auto-update trigger (`update_updated_at_column`).
- **Signup bootstrap**: `handle_new_user()` trigger on `auth.users` inserts a
  matching `user_profiles` row on signup.
- **Vector search**: `questions.embedding` is indexed with `ivfflat` cosine ops
  (`lists = 100`). Rebuild the index (`REINDEX`) once the table has real volume.
- **RLS**: enabled on every table. Students see only published content and
  their own data; admins/moderators have broader policies. Server-only writes
  to `subscriptions` / `payment_transactions` use the service role.

### Typed jsonb shapes

These jsonb columns have dedicated TypeScript types (see
`lib/types/database.types.ts`):

- `questions.options` → `QuestionOptions` (array of `QuestionOption`)
- `questions.correct_answer` → `CorrectAnswer` (discriminated union keyed on `type`)
- `solutions.steps` → `SolutionStep[]`
- `coach_conversations.messages` → `CoachMessage[]`
- `practice_attempts.submitted_answer`, `payment_transactions.metadata`,
  `contributor_submissions.payload` → generic `Json` (flexible, validated at
  the edge with Zod)

## Supabase Plumbing

Three client factories, picked by context. All three are typed with the
`Database` generic from `lib/types/database.types.ts` so queries are fully
typed end-to-end.

| File | Use in | Creates |
| --- | --- | --- |
| `lib/supabase/client.ts` | `"use client"` components, browser-side code | `createBrowserClient<Database>` |
| `lib/supabase/server.ts` | Server Components, Route Handlers, Server Actions | `createServerClient<Database>` bound to `cookies()` from `next/headers` |
| `lib/supabase/middleware.ts` | Exports `updateSession(request)` — called from the root `middleware.ts` | `createServerClient<Database>` bound to `NextRequest` cookies; refreshes the auth cookie on every request |

The root `middleware.ts` runs `updateSession` on every path except Next.js
internals (`/_next/static`, `/_next/image`), the favicon, and common image
extensions. Adjust the matcher in `middleware.ts` when introducing new static
routes that should skip auth refresh.

**Never** import `SUPABASE_SERVICE_ROLE_KEY` into a `"use client"` file. If you
need to bypass RLS from a Route Handler or Server Action, instantiate a one-off
`createClient` from `@supabase/supabase-js` with the service key inside that
module; do not add a shared helper that could be imported by client code.

## Running Migrations

Migrations are plain SQL in `supabase/migrations/`, named `NNNN_name.sql` and
applied in order. Two options to apply `0001_init.sql`:

### Option A — Supabase CLI (preferred)

```bash
# One-time, per machine
supabase login

# One-time, per clone — links this repo to the remote project
supabase init          # only if supabase/config.toml is missing
supabase link --project-ref <PROJECT_REF>

# Apply all pending migrations to the linked project
supabase db push
```

Regenerate `lib/types/database.types.ts` from the live schema after changes:

```bash
supabase gen types typescript --linked --schema public > lib/types/database.types.ts
```

> Regeneration will drop the hand-authored typed jsonb shapes
> (`QuestionOptions`, `CorrectAnswer`, `SolutionStep`, `CoachMessage`). Either
> re-apply them on top of the generated output, or keep the domain types in a
> sibling file and augment `Database` via module declaration.

### Option B — SQL Editor (quick one-off)

Paste `supabase/migrations/0001_init.sql` into **Supabase Dashboard → SQL
Editor → New query → Run**. Requires `pgvector` to already be enabled on the
project (Dashboard → Database → Extensions → `vector`).

## Admin Tool

The admin surface at `/admin/*` is the content ingestion pipeline: curriculum
management, question authoring, and solution taxonomy. It lives in its own
route group (`app/(admin)/`) with its own layout and top bar — the student
sidebar is intentionally hidden.

### Route map

```
/admin/subjects                       Curriculum tree: subjects → chapters → topics
/admin/questions                      Filterable library with bulk publish/archive/delete
/admin/questions/new                  Author a new question (draft)
/admin/questions/[id]/edit            Edit a question + danger-zone delete
/admin/questions/[id]/solutions       6-type reasoning-first solution manager
```

### RLS protection

`/admin/*` is protected by **three concentric layers**:

1. **Layout guard** (`app/(admin)/layout.tsx`): server component,
   `getUser()` → check `user_profiles.role = 'admin'`. Non-admin redirects
   silently to `/`.
2. **Server action guards** (`app/(admin)/admin/**/actions.ts`): every
   mutation calls `adminClient()` which re-checks the role. Returns a
   discriminated `{ ok: false, error }` on failure.
3. **Postgres RLS**: the schema already has
   `"admins manage all questions"` / `"admins manage all solutions"` policies
   that gate writes to admin role. Even if a request somehow reached the DB
   as a non-admin user, the row-level policy would refuse.

Seed + curriculum writes go through the session client (admin user), not
the service role, so RLS still applies end-to-end.

### Adding a new question (end-to-end)

1. **Curriculum first.** The question form requires Subject → Chapter →
   Topic. If `/admin/subjects` is empty, click **Seed JEE Curriculum**
   (one-time, only allowed on an empty tree) or add each level manually.
2. **Click "New Question"** from `/admin/questions` (or top-bar link).
3. **Taxonomy**: pick Subject → Chapter → Topic (cascading selects).
4. **Type**: pick `single_correct`, `multi_correct`, `numerical`, or
   `subjective`. The Answer section re-renders to match.
5. **Question text**: use the MathEditor. `$x^2$` → inline math, `$$...$$` →
   block math. Toolbar buttons insert common LaTeX snippets at the cursor.
6. **Answer section** (one of):
   - MCQ: 4–6 options, each with its own MathEditor. Mark correct via radio
     (single) or checkboxes (multi).
   - Numerical: number + tolerance (default ±0.01).
   - Subjective: a reference / rubric MathEditor.
7. **Metadata**: difficulty slider (1–5), estimated time, source (e.g.
   `JEE Mains 2023 Shift 1`), year.
8. **Save**. Three choices: **Save & Add Another** (preserves taxonomy,
   clears the rest), **Save as Draft → Solutions** (default CTA, goes to
   the solutions manager), or **Cancel**.

### How solutions are structured

Each question owns **up to 6 solutions**, one per taxonomy type. Types are
a CHECK-constrained text column (`solutions.solution_type`):

| Type | Purpose |
| --- | --- |
| `standard` | Textbook step-by-step solve |
| `logical` | Principle-driven reasoning (no heavy computation) |
| `elimination` | Rule options out using dimensions, limits, special cases |
| `shortcut` | Pattern or formula that cuts time dramatically |
| `pattern` | Connects this question to a broader class |
| `trap_warning` | What usually goes wrong and how to avoid it |

Each solution row carries:

- `title` (optional short descriptor), `content` (MathEditor markdown+LaTeX)
- `steps` (jsonb): ordered `{ step_number, text, explanation? }`
- `time_estimate_seconds`, `difficulty_to_execute` (1–5)
- `when_to_use`, `when_not_to_use`, `prerequisites`
- `status`: `draft` / `published` / `ai_generated_unverified` / `flagged`

The **completeness bar** on the solutions page counts covered types. A
question is considered "complete enough for students" at ≥ 3 solution
types — typically `standard` + one alternative + `trap_warning`.

Typed jsonb shapes for `options`, `correct_answer`, and `steps` are
documented in `lib/types/database.types.ts` and re-declared in the server
actions via Zod so client input is validated twice.

### Seed script

```bash
npm run seed:questions
```

Runs `scripts/seed-questions.ts` via `tsx --env-file=.env.local`. It uses
the **service role key** to bypass RLS for bulk inserts. The script is
**idempotent** — for each question it looks for a match on
`source + year + question_text prefix` before inserting, so re-running is
safe.

Preconditions:
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
- Curriculum already seeded (`/admin/subjects → Seed JEE Curriculum`).
  The script resolves topic IDs from the canonical slug tree in
  `lib/constants/jee-curriculum.ts`.

## Practice Flow (student-facing core)

The whole product exists to force students to **commit to a reasoning
approach before they see the answer area**. Every other JEE app lets you
peek at a solution the moment you're stuck; ours doesn't. That asymmetry is
the moat, and the flow is designed around it.

### Route map

```
/practice                             Landing: 3 subject cards + Quick Practice row
/practice/[subject]                   Chapter list for a subject
/practice/[subject]/[chapter]         Topic list (+ "Practice entire chapter" CTA)
/practice/session/[sessionId]         Live session (full-screen, no sidebar)
/practice/session/[sessionId]/summary Post-session breakdown
```

Session URLs live under `(dashboard)` for the auth guard, but their own
`layout.tsx` uses `fixed inset-0 z-40` so the sidebar is visually out of
the way.

### Session state machine (client-side)

```
   ┌─────────────────────┐
   │ approach_selection  │  ← question visible, answer area hidden
   └──────────┬──────────┘
              │ user picks 1 of 5 approaches (1–5 hotkeys)
              ├──────────────────────────────┐
              ▼                              ▼
     ┌─────────────────┐              ┌──────────────┐
     │    solving      │              │ submitted    │ ← reached directly on Skip
     └────────┬────────┘              └──────┬───────┘
              │ Submit (Enter)               │
              ▼                              │
     ┌─────────────────┐                     │
     │    submitted    │◄────────────────────┘
     └────────┬────────┘
              │ Next question  │  End session
              ▼                 ▼
      (loads next, resets) (→ /summary page)
```

All transitions are client React state. The database is the source of
truth for session existence + attempts; UI state is ephemeral.

### The approach mechanic (why)

Most students learn to execute one way and then plateau. We want them to
become fluent in **multiple solution classes** for the same problem. By
forcing a named commitment before the answer reveal, we:

1. Record *how* they approach each question, not just whether they were
   right — this drives future coaching.
2. Make the "Your approach" tab on the result screen a teachable moment:
   they see their approach side-by-side with four others that could have
   worked better or faster.
3. Penalise no behaviour. Picking "Skip" is fully respected — the result
   screen opens with "No problem — here's how to approach this" and the
   student still sees all solution tabs.

The five approaches map to DB `practice_attempts.chosen_approach` and to
the solution-type taxonomy via `APPROACH_TO_SOLUTION` (see
`lib/constants/practice.ts`):

| Approach | Highlighted solution tab |
| --- | --- |
| Full Solve | Standard |
| Elimination | Elimination |
| Pattern Recognition | Pattern |
| Shortcut / Trick | Shortcut |
| Skip | Standard (default fallback) |

### Correctness

Computed client-side for immediate feedback in `checkCorrectness`:

- **single_correct**: `submitted.value === correct.value`
- **multi_correct**: sorted-array equality
- **numerical**: `|submitted - correct| <= tolerance` (default 0.01)
- **subjective**: `null` (always shown the reference answer)

The server action `submitAttempt` stores the same verdict in
`practice_attempts.is_correct`. Skip is recorded as `is_correct = false`
with `chosen_approach = 'skip'`.

### XP formula

Implemented in `computeXp()` inside `practice/actions.ts`:

```
per attempt:
  +2 XP  (always — reward effort)
  +10 XP if correct
  +5 XP if correct AND approach ≠ 'full_solve'   (reward smart methods)
  never negative
```

Session XP is totaled on `endSession` and added to `user_profiles.xp_total`.
The per-session value is also stored on `practice_sessions.xp_earned` so
the summary page can render it even after profile aggregation.

### Streak logic

Also in `endSession`:

```
today  = YYYY-MM-DD (UTC)
yday   = YYYY-MM-DD (today − 1d)

if profile.last_active_date == today:
  # Already counted today — no-op on streak.
elif profile.last_active_date == yday:
  current_streak = current_streak + 1
else:
  current_streak = 1   # broke / starting over

longest_streak = max(longest_streak, current_streak)
last_active_date = today
```

Only runs when `endSession` actually ends a session (the action is
idempotent — re-visits to the summary page don't double-count).

### Query helpers

`lib/queries/practice.ts` exposes server-side helpers consumed by the
practice pages. All respect RLS:

| Function | Used by |
| --- | --- |
| `getSubjectsWithCounts(userId)` | Practice landing |
| `getChaptersForSubject(slug, userId)` | Subject page |
| `getTopicsForChapter(subjectSlug, chapterSlug, userId)` | Chapter page |
| `getNextQuestionForTopic(topicId, userId)` | Future use (spaced-rep-style picks outside a session) |
| `pickQuestionForSession(sessionId, scope, userId)` | Session page + `getNextQuestion` action |
| `getQuestionWithSolutions(questionId)` | Session page (server-side hydration) |

### Known limitations (deferred)

- **Spaced repetition is not integrated.** Wrong answers don't auto-queue
  into `review_queue` yet — that's the next step (SM-2 driver + review
  picker).
- **Daily challenges** aren't wired — the `daily_challenges` and
  `user_daily_challenges` tables exist but are unused.
- **AI coach** (`coach_conversations`) is schema-only; no live coaching.
- **Subjective grading** is marker-only in v1. The student sees the
  reference answer but gets `is_correct = null` on the attempt row.
- The session page lives inside the (dashboard) route group and overlays
  the sidebar with `fixed inset-0`. Functionally fine, but it means the
  sidebar briefly renders underneath on first paint. Fine for now.

## Commands

```bash
npm run dev               # Start dev server
npm run build             # Production build
npm run start             # Run production build
npm run lint              # ESLint
npm run seed:questions    # Bulk-insert 10 JEE-style questions + solutions
```
