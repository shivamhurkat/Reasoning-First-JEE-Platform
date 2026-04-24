import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    /* min-h-screen so background fills on short screens;
       items-start on mobile (form starts at top with padding),
       items-center on md+ (centred in viewport) */
    <div className="relative flex min-h-screen items-start justify-center bg-background px-4 pt-12 pb-8 md:items-center md:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.46_0.22_264/0.08),transparent)]"
      />
      {/* Full-width on mobile, capped at 420px on larger screens */}
      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold tracking-tight">
              ReasonLab
            </span>
            <span className="ml-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
              JEE
            </span>
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Reasoning-first JEE preparation
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
