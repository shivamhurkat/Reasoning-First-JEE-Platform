"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

  if (verified) {
    return (
      <Card>
        <CardContent className="grid gap-5 pt-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Check your inbox</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a verification link to{" "}
                <strong className="text-foreground">{signupEmail}</strong>.
                Click it to activate your account.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            disabled={resending}
            onClick={handleResend}
          >
            {resending ? "Sending…" : "Resend verification email"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already verified?{" "}
            <Link href="/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Start practising smarter with reasoning-first solutions.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      autoComplete="name"
                      placeholder="Aarav Sharma"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        if (emailExists) setEmailExists(false)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phone{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_exam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Preparing for{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) =>
                      field.onChange(v === "" ? undefined : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="JEE Mains">JEE Mains</SelectItem>
                      <SelectItem value="JEE Advanced">JEE Advanced</SelectItem>
                      <SelectItem value="NEET">NEET</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating account…" : "Create account"}
            </Button>

            {emailExists ? (
              <p className="text-center text-sm text-destructive">
                An account with this email already exists.{" "}
                <Link href="/login" className="font-medium underline underline-offset-4">
                  Log in instead
                </Link>
              </p>
            ) : null}
          </form>
        </Form>

        <div className="relative my-2">
          <Separator />
          <span className="absolute inset-0 -top-2.5 flex justify-center">
            <span className="bg-card px-2 text-xs text-muted-foreground">
              Or continue with
            </span>
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={oauthLoading}
          onClick={signInWithGoogle}
        >
          {oauthLoading ? "Redirecting…" : "Continue with Google"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
