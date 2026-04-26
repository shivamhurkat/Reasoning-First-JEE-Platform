"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Rocket,
  Menu,
  X,
} from "lucide-react"

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-[#111318] text-[#e2e2e8]">
      {/* ── HEADER ── */}
      <header className="fixed top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Rocket className="size-5 text-blue-500 transition-transform duration-300 group-hover:rotate-[-15deg]" />
            <span className="text-xl font-bold tracking-tighter text-slate-50">
              RankersKit
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  pathname === link.href
                    ? "text-blue-400 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Login + CTA */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:block text-slate-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              Log in
            </Link>
            <Link href="/signup">
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                Get Started
              </button>
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden ml-1 p-2 rounded-md hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="size-5 text-slate-200" />
              ) : (
                <Menu className="size-5 text-slate-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#020617]/95 backdrop-blur-xl">
            <nav className="flex flex-col px-4 py-4 gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px] flex items-center ${
                    pathname === link.href
                      ? "text-blue-400 bg-blue-400/10 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/10 mt-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all min-h-[44px] flex items-center"
                >
                  Log in
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 pt-16">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="w-full py-12 px-4 sm:px-6 border-t border-white/5 bg-[#020617]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <Rocket className="size-5 text-blue-500" />
              <span className="text-lg font-bold tracking-tighter text-slate-50">
                RankersKit
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Built for JEE aspirants who want to think smarter, not just harder.
            </p>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} RankersKit. For the elite 1%.
            </p>
          </div>
          <div className="col-span-1">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/features" className="hover:text-blue-400 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-blue-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-400 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-1">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="mailto:shivam123.sh@gmail.com" className="hover:text-blue-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
