import { Skeleton } from "@/components/ui/skeleton"

export default function PracticeLoading() {
  return (
    <div className="grid gap-6 animate-pulse">
      {/* Heading */}
      <div className="grid gap-1.5">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Subject cards */}
      <div className="grid gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>

      {/* Quick practice row */}
      <div className="grid gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
  )
}
