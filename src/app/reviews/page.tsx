import { Suspense } from "react";
import type { Metadata } from "next";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { Skeleton } from "@/components/shared/Skeleton";

export const metadata: Metadata = {
  title: "Alle Reviews",
  description:
    "Durchsuche unsere neuesten Reviews zu Games, Filmen und Serien. Unabhängige Tests, Wertungen und Kaufberatung auf Nerdiction.",
  alternates: {
    canonical: "/reviews",
  },
};

function ReviewsListSkeleton() {
  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col gap-6 border-b border-border pb-10">
        <div className="flex flex-col space-y-3">
          <Skeleton className="skeleton-shimmer h-4 w-40 rounded-sm" />
          <Skeleton className="skeleton-shimmer h-14 w-72 md:w-96 rounded-sm" />
          <Skeleton className="skeleton-shimmer h-5 w-full max-w-xl rounded-sm" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="skeleton-shimmer h-16 w-36 rounded-sm" />
          <Skeleton className="skeleton-shimmer h-16 w-36 rounded-sm" />
          <Skeleton className="skeleton-shimmer h-16 w-36 rounded-sm" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 border-b border-border pb-6">
        <Skeleton className="skeleton-shimmer h-8 w-20 rounded-sm" />
        <Skeleton className="skeleton-shimmer h-8 w-20 rounded-sm" />
        <Skeleton className="skeleton-shimmer h-8 w-20 rounded-sm" />
        <Skeleton className="skeleton-shimmer h-8 w-40 ml-auto rounded-sm" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="skeleton-shimmer aspect-[16/9] w-full rounded-sm" />
            <Skeleton className="skeleton-shimmer h-4 w-1/3 rounded-sm" />
            <Skeleton className="skeleton-shimmer h-6 w-3/4 rounded-sm" />
            <Skeleton className="skeleton-shimmer h-4 w-full rounded-sm" />
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

