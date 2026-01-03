import { Suspense } from "react";
import { Metadata } from "next";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { Skeleton } from "@/components/shared/Skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, BarChart3 } from "lucide-react";

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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";

export const metadata: Metadata = {
  title: "Alle Reviews - Game & Hardware Tests",
  description: "Durchsuche unsere umfangreiche Sammlung von professionellen Game- und Hardware-Reviews. Finde die besten Tests und Bewertungen für deine Kaufentscheidung.",
  alternates: {
    canonical: `${baseUrl}/reviews`,
  },
  openGraph: {
    title: "Alle Reviews - Game & Hardware Tests | Nerdiction",
    description: "Durchsuche unsere umfangreiche Sammlung von professionellen Game- und Hardware-Reviews.",
    url: `${baseUrl}/reviews`,
    siteName: "Nerdiction",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alle Reviews - Game & Hardware Tests",
    description: "Durchsuche unsere umfangreiche Sammlung von professionellen Game- und Hardware-Reviews.",
  },
};

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

export default function ReviewsPage() {
  return (
    <div className="space-y-8">
      {/* Quick Links */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
        <Link href="/collections">
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="size-4" />
            Collections
          </Button>
        </Link>
        <Link href="/statistics">
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="size-4" />
            Statistiken
          </Button>
        </Link>
      </div>

      <Suspense fallback={<ReviewsListSkeleton />}>
        <ReviewsList />
      </Suspense>
    </div>
  );
}

