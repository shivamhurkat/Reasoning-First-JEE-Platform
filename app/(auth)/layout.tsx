import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-background">
      {/* Subtle radial gradient behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.08),transparent)]"
      />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
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
