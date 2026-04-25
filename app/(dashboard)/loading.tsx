import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="grid gap-6 animate-pulse">
      {/* Greeting */}
      <div className="grid gap-1.5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Streak + XP row */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>

      {/* Primary CTA */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

      {/* Recent sessions */}
      <div className="grid gap-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    </div>
  )
}
