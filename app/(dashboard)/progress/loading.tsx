import { Skeleton } from "@/components/ui/skeleton"

export default function ProgressLoading() {
  return (
    <div className="grid gap-8 animate-pulse">
      {/* Heading */}
      <Skeleton className="h-8 w-32" />

      {/* Overview stats — 2×2 on mobile, 4-col on sm+ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>

      {/* Subject mastery cards */}
      <div className="grid gap-2">
        <Skeleton className="h-3 w-32" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>

      {/* Topic accordion */}
      <div className="grid gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>

      {/* Recent activity */}
      <div className="grid gap-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    </div>
  )
}
