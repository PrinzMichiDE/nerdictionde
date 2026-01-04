import prisma from "@/lib/prisma";
import { Review } from "@/types/review";
import { ReviewHero } from "@/components/home/ReviewHero";
import { LargeReviewCard } from "@/components/home/LargeReviewCard";
import { CategoryFilter } from "@/components/home/CategoryFilter";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch latest reviews
  let latestReviews: Review[] = [];
  let topRatedReviews: Review[] = [];
  let featuredReview: Review | null = null;
  let allReviews: Array<{ score: number; category: string; createdAt: Date }> = [];
  let statistics = {
    totalReviews: 0,
    averageScore: 0,
    gameReviews: 0,
    hardwareReviews: 0,
    amazonReviews: 0,
    movieReviews: 0,
    seriesReviews: 0,
  };

  try {
    latestReviews = (await prisma.review.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: 6,
    })) as unknown as Review[];

    // Fetch top-rated reviews
    topRatedReviews = (await prisma.review.findMany({
      where: { status: "published" },
      orderBy: { score: "desc" },
      take: 6,
    })) as unknown as Review[];

    // Fetch featured review (highest scored review)
    featuredReview = (await prisma.review.findFirst({
      where: { status: "published" },
      orderBy: { score: "desc" },
    })) as unknown as Review | null;

    // Remove featured review from latestReviews and topRatedReviews to avoid duplicates
    if (featuredReview) {
      latestReviews = latestReviews.filter((r) => r.id !== featuredReview!.id);
      topRatedReviews = topRatedReviews.filter((r) => r.id !== featuredReview!.id);
    }

    // Also remove duplicates between latestReviews and topRatedReviews
    const latestReviewIds = new Set(latestReviews.map((r) => r.id));
    topRatedReviews = topRatedReviews.filter((r) => !latestReviewIds.has(r.id));

    // Calculate statistics
    const totalReviews = await prisma.review.count({
      where: { status: "published" },
    });

    const gameReviews = await prisma.review.count({
      where: { status: "published", category: "game" },
    });

    const hardwareReviews = await prisma.review.count({
      where: { status: "published", category: "hardware" },
    });

    const amazonReviews = await prisma.review.count({
      where: { status: "published", category: "amazon" },
    });

    const movieReviews = await prisma.review.count({
      where: { status: "published", category: "movie" },
    });

    const seriesReviews = await prisma.review.count({
      where: { status: "published", category: "series" },
    });

    const allScores = await prisma.review.findMany({
      where: { status: "published" },
      select: { score: true },
    });

    const averageScore =
      allScores.length > 0
        ? allScores.reduce((sum, review) => sum + review.score, 0) / allScores.length
        : 0;

    // Get all reviews for charts
    allReviews = (await prisma.review.findMany({
      where: { status: "published" },
      select: { score: true, category: true, createdAt: true },
    })) as unknown as Array<{ score: number; category: string; createdAt: Date }>;

    statistics = {
      totalReviews,
      averageScore,
      gameReviews,
      hardwareReviews,
      amazonReviews,
      movieReviews: movieReviews || 0,
      seriesReviews: seriesReviews || 0,
    };
  } catch (error) {
    // Silently fail during build if database is not available
    console.error("Error fetching data:", error);
  }

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Review - Featured */}
      {featuredReview && <ReviewHero review={featuredReview} />}

      {/* Category Filter */}
      <CategoryFilter />

      {/* Latest Reviews Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
              Neueste Reviews
            </h2>
            <p className="text-muted-foreground text-lg">
              Professionelle Tests und Bewertungen
            </p>
          </div>
          <Link 
            href="/reviews" 
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            Alle ansehen
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
        
        {latestReviews.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {latestReviews.map((review, index) => (
              <LargeReviewCard 
                key={review.id}
                review={review}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed rounded-2xl bg-muted/30">
            <p className="text-muted-foreground text-xl font-semibold">Noch keine Reviews vorhanden.</p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Bald findest du hier die neuesten Reviews und Tests.
            </p>
          </div>
        )}
      </section>

      {/* Top Rated Reviews */}
      {topRatedReviews.length > 0 && (
        <section className="space-y-8 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                Top Bewertungen
              </h2>
              <p className="text-muted-foreground text-lg">
                Die besten Reviews unserer Redaktion
              </p>
            </div>
            <Link 
              href="/reviews?sort=score-desc" 
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
            >
              Alle Top-Reviews
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {topRatedReviews.slice(0, 6).map((review) => (
              <LargeReviewCard 
                key={review.id}
                review={review}
              />
            ))}
          </div>
        </section>
      )}

      {/* View All CTA */}
      <div className="text-center py-12">
        <Button
          asChild
          size="lg"
          className="rounded-full text-lg px-8 py-6 h-auto"
        >
          <Link href="/reviews">
            Alle Reviews entdecken
          </Link>
        </Button>
      </div>
    </div>
  );
}
