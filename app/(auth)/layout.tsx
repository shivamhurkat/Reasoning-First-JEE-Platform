import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight"
          >
            Reasoning-First JEE
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
