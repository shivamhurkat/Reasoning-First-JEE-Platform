import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 glass-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-lg font-bold tracking-tight">ReasonLab</span>
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
              JEE
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Log in
            </Button>
            <Button size="sm" render={<Link href="/signup" />}>
              Sign up
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/40 py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <span className="font-bold">ReasonLab</span>
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                  JEE
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Built for JEE aspirants, by someone who&apos;s been there.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="mailto:shivam123.sh@gmail.com" className="hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
