"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { BarChart3, Calendar, Flame, Loader2, Lock, Trophy, User } from "lucide-react"

import { updateProfile, changePassword } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type Profile = {
  full_name: string | null
  phone: string | null
  target_exam: string
  class_level: string | null
  target_year: number | null
  xp_total: number
  current_streak: number
  created_at: string
}

type Props = {
  email: string
  profile: Profile
  attemptsCount: number
}

export function SettingsClient({ email, profile, attemptsCount }: Props) {
  return (
    <div className="grid gap-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <ProfileSection email={email} profile={profile} />
      <AccountSection />
      <DataSection profile={profile} attemptsCount={attemptsCount} />
    </div>
  )
}

// ── Section 1: Profile ────────────────────────────────────────────────────────

function ProfileSection({ email, profile }: { email: string; profile: Profile }) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.ok) toast.success("Profile saved")
      else toast.error(result.error)
    })
  }

  return (
    <section className="grid gap-4">
      <SectionHeading icon={<User className="size-4" />} title="Profile" />
      <Separator />

      <form onSubmit={handleSubmit} className="grid gap-5">
        <Field label="Full name" htmlFor="full_name">
          <Input
            id="full_name"
            name="full_name"
            defaultValue={profile.full_name ?? ""}
            placeholder="Your full name"
            className="min-h-[48px] text-base"
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <div className="flex min-h-[48px] items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
            {email}
          </div>
        </Field>

        <Field label="Phone" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            placeholder="+91 98765 43210"
            className="min-h-[48px] text-base"
          />
        </Field>

        <Field label="Target exam" htmlFor="target_exam">
          <NativeSelect
            id="target_exam"
            name="target_exam"
            defaultValue={profile.target_exam}
            options={[
              { value: "jee_mains", label: "JEE Mains" },
              { value: "jee_advanced", label: "JEE Advanced" },
              { value: "neet", label: "NEET" },
              { value: "other", label: "Other" },
            ]}
          />
        </Field>

        <Field label="Class level" htmlFor="class_level">
          <NativeSelect
            id="class_level"
            name="class_level"
            defaultValue={profile.class_level ?? ""}
            options={[
              { value: "", label: "— Not set —" },
              { value: "11", label: "Class 11" },
              { value: "12", label: "Class 12" },
              { value: "dropper", label: "Dropper" },
            ]}
          />
        </Field>

        <Field label="Target year" htmlFor="target_year">
          <Input
            id="target_year"
            name="target_year"
            type="number"
            defaultValue={profile.target_year ?? ""}
            placeholder="2026"
            min={2024}
            max={2035}
            className="min-h-[48px] text-base"
          />
        </Field>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full min-h-[48px] text-base"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </section>
  )
}

// ── Section 2: Account ────────────────────────────────────────────────────────

function AccountSection() {
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await changePassword(formData)
      if (result.ok) {
        toast.success("Password changed")
        setShowPasswordForm(false)
        ;(e.target as HTMLFormElement).reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <section className="grid gap-4">
      <SectionHeading icon={<Lock className="size-4" />} title="Account" />
      <Separator />

      <div className="grid gap-3">
        {showPasswordForm ? (
          <form onSubmit={handlePasswordSubmit} className="grid gap-4 rounded-xl border p-4">
            <p className="text-sm font-medium">Change password</p>

            <Field label="New password" htmlFor="new_password">
              <Input
                id="new_password"
                name="new_password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="min-h-[48px] text-base"
                autoComplete="new-password"
              />
            </Field>

            <Field label="Confirm password" htmlFor="confirm_password">
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                placeholder="Repeat new password"
                className="min-h-[48px] text-base"
                autoComplete="new-password"
              />
            </Field>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 min-h-[48px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-[48px]"
                onClick={() => setShowPasswordForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            className="w-full min-h-[48px] justify-start gap-2"
            onClick={() => setShowPasswordForm(true)}
          >
            <Lock className="size-4" />
            Change password
          </Button>
        )}

        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="outline"
            className="w-full min-h-[48px] justify-start gap-2 text-destructive hover:text-destructive"
          >
            Sign out
          </Button>
        </form>
      </div>
    </section>
  )
}

// ── Section 3: Data ────────────────────────────────────────────────────────────

function DataSection({
  profile,
  attemptsCount,
}: {
  profile: Profile
  attemptsCount: number
}) {
  const createdAt = (() => {
    try {
      return format(new Date(profile.created_at), "d MMM yyyy")
    } catch {
      return "—"
    }
  })()

  return (
    <section className="grid gap-4">
      <SectionHeading icon={<BarChart3 className="size-4" />} title="Your data" />
      <Separator />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Calendar className="size-4 text-muted-foreground" />}
          label="Member since"
          value={createdAt}
        />
        <StatCard
          icon={<Trophy className="size-4 text-amber-500" />}
          label="Total XP"
          value={String(profile.xp_total)}
        />
        <StatCard
          icon={<Flame className="size-4 text-orange-500" />}
          label="Current streak"
          value={`${profile.current_streak}d`}
        />
        <StatCard
          icon={<BarChart3 className="size-4 text-primary" />}
          label="Questions tried"
          value={String(attemptsCount)}
        />
      </div>
    </section>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function NativeSelect({
  id,
  name,
  defaultValue,
  options,
}: {
  id: string
  name: string
  defaultValue: string
  options: { value: string; label: string }[]
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      className="w-full rounded-md border bg-background px-3 text-base min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2">{icon}</div>
      <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}
