"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CheckCircle2, ArrowRight, Mail, Lock } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})
type LoginValues = z.infer<typeof loginSchema>

function VerifiedBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get("verified") !== "true") return null
  return (
    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
      <CheckCircle2 className="size-4 shrink-0" />
      Email verified! You can now sign in.
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function LoginFormInner() {
  const router = useRouter()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    setSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  const signInWithGoogle = async () => {
    setOauthLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setOauthLoading(false)
      toast.error(error.message)
    }
  }

  const { register, handleSubmit, formState: { errors } } = form

  return (
    <>
      <Suspense>
        <VerifiedBanner />
      </Suspense>

      {/* Header */}
      <header className="flex flex-col items-center text-center gap-1 mb-8">
        <h1 className="text-xl font-semibold text-[#e2e2e8]">
          Sign in to RankersKit
        </h1>
        <p className="text-sm text-[#c1c6d7]">
          Continue to your elite dashboard.
        </p>
      </header>

      {/* Google OAuth */}
      <button
        type="button"
        disabled={oauthLoading}
        onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-[#1e2024] border border-[#414755]/30 hover:bg-[#282a2e] hover:border-[#414755] transition-all duration-300 group min-h-[48px] disabled:opacity-50"
      >
        <GoogleIcon />
        <span className="text-sm text-[#e2e2e8] group-hover:text-white transition-colors">
          {oauthLoading ? "Redirecting…" : "Continue with Google"}
        </span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#414755]/50" />
        <span className="text-xs font-semibold uppercase tracking-widest text-[#c1c6d7]">
          Or
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#414755]/50" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-widest text-[#c1c6d7]"
          >
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 ml-1 size-4 text-[#c1c6d7]/50 group-focus-within:text-[#4b8eff] transition-colors" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              {...register("email")}
              className="w-full bg-transparent border-0 border-b border-[#414755]/50 pl-7 pr-0 py-3 text-[#e2e2e8] text-sm focus:ring-0 focus:border-[#4b8eff] focus:outline-none transition-all placeholder:text-[#c1c6d7]/30"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-widest text-[#c1c6d7]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#adc6ff] hover:text-[#d8e2ff] transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-0 top-1/2 -translate-y-1/2 ml-1 size-4 text-[#c1c6d7]/50 group-focus-within:text-[#4b8eff] transition-colors" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className="w-full bg-transparent border-0 border-b border-[#414755]/50 pl-7 pr-0 py-3 text-[#e2e2e8] text-sm focus:ring-0 focus:border-[#4b8eff] focus:outline-none transition-all placeholder:text-[#c1c6d7]/30"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full py-4 rounded-lg bg-[#4b8eff] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#adc6ff] hover:text-[#002e69] hover:shadow-[0_0_20px_rgba(75,142,255,0.3)] transition-all duration-300 group relative overflow-hidden min-h-[48px] disabled:opacity-50"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
          />
          <span className="relative z-10">
            {submitting ? "Signing in…" : "Sign In"}
          </span>
          {!submitting && (
            <ArrowRight className="relative z-10 size-4 group-hover:translate-x-1 transition-transform" />
          )}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center text-sm text-[#c1c6d7] mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-[#adc6ff] hover:text-[#d8e2ff] transition-colors underline underline-offset-4 decoration-[#adc6ff]/30"
        >
          Sign up
        </Link>
      </p>
    </>
  )
}

export default function LoginForm() {
  return (
    <div className="bg-[#0c0e12]/60 backdrop-blur-xl border-t border-l border-white/5 rounded-xl p-8 sm:p-10 shadow-2xl flex flex-col gap-2">
      <LoginFormInner />
    </div>
  )
}
