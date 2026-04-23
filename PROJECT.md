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
| `/practice`, `/progress`, `/settings` | **Protected** | `app/(dashboard)/<name>/page.tsx` |

Protection is enforced in `app/(dashboard)/layout.tsx` — it calls
`supabase.auth.getUser()` and `redirect('/login')` if the user is null. The
session cookie itself is refreshed on **every** request by the root
`middleware.ts` → `updateSession` helper.

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

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint
```
