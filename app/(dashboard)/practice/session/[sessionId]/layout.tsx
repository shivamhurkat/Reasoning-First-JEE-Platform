export default function SessionShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The parent (dashboard) layout already renders the sidebar + AppShell. We
  // overlay the session UI on top using fixed positioning so the sidebar is
  // visually out of the way — reloads still work because the outer layout's
  // auth guard has already run.
  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-background">
      {children}
    </div>
  )
}
