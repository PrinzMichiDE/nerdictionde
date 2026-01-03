import { Suspense } from "react";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { Skeleton } from "@/components/shared/Skeleton";

function ReviewsListSkeleton() {
  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="space-y-4 pb-6 border-b">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-[180px]" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<ReviewsListSkeleton />}>
      <ReviewsList />
    </Suspense>
  );
}

