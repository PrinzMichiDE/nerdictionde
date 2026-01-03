import { Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-16 w-full max-w-2xl mx-auto" />
        <Skeleton className="h-6 w-full max-w-xl mx-auto" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-12 w-32 rounded-full" />
          <Skeleton className="h-12 w-32 rounded-full" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
