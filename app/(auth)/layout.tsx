import Link from "next/link"
import { Rocket } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-start justify-center bg-[#111318] text-[#e2e2e8] px-4 pt-12 pb-8 md:items-center md:py-8 overflow-hidden">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(121,0,205,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-[#005bc1]/10 rounded-full blur-[80px] pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Logo + branding header */}
        <div className="mb-6 text-center flex flex-col items-center">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-12 h-12 rounded-lg bg-[#333539] border border-white/5 flex items-center justify-center shadow-inner">
              <Rocket className="size-5 text-blue-500 transition-transform duration-300 group-hover:rotate-[-15deg]" />
            </div>
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
