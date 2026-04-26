"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CheckCircle2, ArrowRight, ChevronDown } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

const signupSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .max(80, "Name is too long"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least one number"),
    confirm_password: z.string(),
    phone: z.string().trim().max(20).optional(),
    target_exam: z.enum(["JEE Mains", "JEE Advanced", "NEET", "Other"]).optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  })

type SignupValues = z.infer<typeof signupSchema>

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

export default function SignupForm() {
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [resending, setResending] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")
  const [emailExists, setEmailExists] = useState(false)

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
      phone: "",
      target_exam: undefined,
    },
  })

  const onSubmit = async (values: SignupValues) => {
    setSubmitting(true)
    const trimmedName = values.full_name.trim()

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: trimmedName },
        emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
      },
    })

    if (error) {
      setSubmitting(false)
      toast.error(error.message)
      return
    }

    // Supabase returns a fake success with an empty identities array when
    // "Confirm email" is enabled and the email is already registered — to
    // prevent email enumeration. Detect and surface this case explicitly.
    if (data.user?.identities?.length === 0) {
      setSubmitting(false)
      toast.error("An account with this email already exists.")
      setEmailExists(true)
      return
    }

    // Update user_profiles with all provided fields
    if (data.user) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          full_name: trimmedName,
          phone: values.phone?.trim() || null,
          target_exam: values.target_exam ?? "JEE Mains",
        })
        .eq("id", data.user.id)
      if (profileError) {
        console.warn("Failed to update profile:", profileError.message)
      }
    }

    setSubmitting(false)
    setSignupEmail(values.email)
    setVerified(true)
  }

  const handleResend = async () => {
    if (!signupEmail) return
    setResending(true)
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: signupEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
      },
    })
    setResending(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Verification email resent.")
    }
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

  // ── Verification state ──
  if (verified) {
    return (
      <div className="bg-[#0c0e12]/60 backdrop-blur-xl border-t border-l border-white/5 rounded-xl p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-7 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#e2e2e8]">
              Check your inbox
            </h2>
            <p className="mt-2 text-sm text-[#c1c6d7]">
              We sent a verification link to{" "}
              <strong className="text-[#e2e2e8]">{signupEmail}</strong>.
              Click it to activate your account.
            </p>
          </div>
          <button
            type="button"
            disabled={resending}
            onClick={handleResend}
            className="w-full py-3 px-4 rounded-lg border border-[#414755] text-[#e2e2e8] hover:bg-[#333539] transition-colors text-sm font-medium min-h-[48px] disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend verification email"}
          </button>
          <p className="text-sm text-[#c1c6d7]">
            Already verified?{" "}
            <Link
              href="/login"
              className="text-[#adc6ff] hover:text-[#d8e2ff] transition-colors underline underline-offset-4 decoration-[#adc6ff]/30"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Signup form ──
  return (
    <div className="bg-[#1e2024]/60 backdrop-blur-[20px] rounded-xl border border-white/5 border-t-white/10 border-l-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden relative">
      {/* Inner ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none"
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="flex flex-col items-center mb-8">
          <h1 className="text-xl font-semibold text-[#e2e2e8] text-center mb-1">
            Join RankersKit
          </h1>
          <p className="text-sm text-[#c1c6d7] text-center">
            For the elite 1%.
          </p>
        </header>

        {/* Google OAuth */}
        <button
          type="button"
          disabled={oauthLoading}
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-[#1e2024] border border-[#414755]/30 hover:bg-[#282a2e] hover:border-[#414755] transition-all duration-300 group min-h-[48px] disabled:opacity-50 mb-6"
        >
          <GoogleIcon />
          <span className="text-sm text-[#e2e2e8] group-hover:text-white transition-colors">
            {oauthLoading ? "Redirecting…" : "Continue with Google"}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#414755]/50" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#c1c6d7]">
            Or
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#414755]/50" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="fullName"
              className="text-xs font-semibold uppercase tracking-widest text-[#c1c6d7] ml-1"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Aarav Sharma"
              required
              {...register("full_name")}
              className="w-full bg-[#0c0e12] text-[#e2e2e8] text-sm border-b border-[#333539] rounded-t px-4 py-3 outline-none focus:border-[#005bc1] transition-colors placeholder:text-[#c1c6d7]/40"
            />
            {errors.full_name && (
              <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="signupEmail"
              className="text-xs font-semibold uppercase tracking-widest text-[#c1c6d7] ml-1"
            >
              Email Address
            </label>
            <input
              id="signupEmail"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
              {...register("email", {
                onChange: () => {
                  if (emailExists) setEmailExists(false)
                },
              })}
              className="w-full bg-[#0c0e12] text-[#e2e2e8] text-sm border-b border-[#333539] rounded-t px-4 py-3 outline-none focus:border-[#005bc1] transition-colors placeholder:text-[#c1c6d7]/40"
            />
            {errors.email && (
              <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="signupPassword"
              className="text-xs font-semibold uppercase tracking-widest text-[#c1c6d7] ml-1"
            >
              Password
            </label>
            <input
              id="signupPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              {...register("password")}
              className="w-full bg-[#0c0e12] text-[#e2e2e8] text-sm border-b border-[#333539] rounded-t px-4 py-3 outline-none focus:border-[#005bc1] transition-colors placeholder:text-[#c1c6d7]/40"
            />
            {errors.password && (
              <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-semibold uppercase tracking-widest text-[#c1c6d7] ml-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              {...register("confirm_password")}
              className="w-full bg-[#0c0e12] text-[#e2e2e8] text-sm border-b border-[#333539] rounded-t px-4 py-3 outline-none focus:border-[#005bc1] transition-colors placeholder:text-[#c1c6d7]/40"
            />
            {errors.confirm_password && (
              <p className="text-xs text-red-400 mt-1">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          {/* Phone (optional) */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="phone"
              className="text-xs font-semibold uppercase tracking-widest text-[#c1c6d7] ml-1"
            >
              Phone Number{" "}
              <span className="normal-case tracking-normal font-normal text-[#c1c6d7]/60">
                (Optional)
              </span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 00000 00000"
              {...register("phone")}
              className="w-full bg-[#0c0e12] text-[#e2e2e8] text-sm border-b border-[#333539] rounded-t px-4 py-3 outline-none focus:border-[#005bc1] transition-colors placeholder:text-[#c1c6d7]/40"
            />
          </div>

          {/* Target Exam (optional) */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="preparingFor"
              className="text-xs font-semibold uppercase tracking-widest text-[#c1c6d7] ml-1"
            >
              Preparing For?{" "}
              <span className="normal-case tracking-normal font-normal text-[#c1c6d7]/60">
                (Optional)
              </span>
            </label>
            <div className="relative">
              <select
                id="preparingFor"
                {...register("target_exam")}
                className="w-full bg-[#0c0e12] text-[#e2e2e8] text-sm border-b border-[#333539] rounded-t px-4 py-3 outline-none focus:border-[#005bc1] transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select your exam</option>
                <option value="JEE Mains">JEE Mains</option>
                <option value="JEE Advanced">JEE Advanced</option>
                <option value="NEET">NEET</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-[#c1c6d7] pointer-events-none" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 relative w-full bg-[#005bc1] text-white font-semibold text-sm py-3 px-6 rounded flex items-center justify-center gap-2 overflow-hidden hover:shadow-[0_0_20px_rgba(0,91,193,0.5)] transition-all duration-300 group min-h-[48px] disabled:opacity-50"
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none"
            />
            <span className="relative z-10">
              {submitting ? "Creating account…" : "Start Practicing"}
            </span>
            {!submitting && (
              <ArrowRight className="relative z-10 size-4 group-hover:translate-x-1 transition-transform duration-300" />
            )}
          </button>

          {emailExists ? (
            <p className="text-center text-sm text-red-400">
              An account with this email already exists.{" "}
              <Link
                href="/login"
                className="font-medium underline underline-offset-4 text-[#adc6ff]"
              >
                Log in instead
              </Link>
            </p>
          ) : null}
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="text-sm text-[#c1c6d7] hover:text-[#005bc1] transition-colors duration-200"
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
