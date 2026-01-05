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
    productReviews: 0,
    movieReviews: 0,
    seriesReviews: 0,
  };

  try {
    // Fetch featured review first (highest scored review)
    featuredReview = (await prisma.review.findFirst({
      where: { status: "published" },
      orderBy: { score: "desc" },
    })) as unknown as Review | null;

    // Fetch latest reviews, excluding featured review
    const latestReviewsQuery: any = {
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: 6,
    };
    
    if (featuredReview) {
      latestReviewsQuery.where.id = { not: featuredReview.id };
    }
    
    latestReviews = (await prisma.review.findMany(latestReviewsQuery)) as unknown as Review[];

    // Fetch top-rated reviews, excluding featured review and latest reviews
    const excludedIds = new Set<string>();
    if (featuredReview) {
      excludedIds.add(featuredReview.id);
    }
    latestReviews.forEach((r) => excludedIds.add(r.id));

    const topRatedQuery: any = {
      where: {
        status: "published",
        id: excludedIds.size > 0 ? { notIn: Array.from(excludedIds) } : undefined,
      },
      orderBy: { score: "desc" },
      take: 6,
    };

    // Remove undefined fields
    if (!topRatedQuery.where.id) {
      delete topRatedQuery.where.id;
    }

    topRatedReviews = (await prisma.review.findMany(topRatedQuery)) as unknown as Review[];

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

    const productReviews = await prisma.review.count({
      where: { status: "published", category: { in: ["product", "amazon"] } },
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
      productReviews,
      movieReviews: movieReviews || 0,
      seriesReviews: seriesReviews || 0,
    };
  } catch (error) {
    // Silently fail during build if database is not available
    console.error("Error fetching data:", error);
  }

  return (
    <div className="space-y-16 md:space-y-20 lg:space-y-24 pb-16 md:pb-24 lg:pb-32 max-w-7xl mx-auto">
      {/* Hero Review - Featured */}
      {featuredReview && <ReviewHero review={featuredReview} />}

      {/* Category Filter */}
      <CategoryFilter />

      {/* Latest Reviews Grid */}
      <section className="space-y-8 md:space-y-10 lg:space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-2 md:mb-3">
              Neueste Reviews
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl lg:text-2xl">
              Professionelle Tests und Bewertungen
            </p>
          </div>
          <Link 
            href="/reviews" 
            className="hidden sm:flex items-center gap-2 text-sm md:text-base font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            Alle ansehen
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
        
        {latestReviews.length > 0 ? (
          <div className="grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {latestReviews.map((review, index) => (
              <LargeReviewCard 
                key={review.id}
                review={review}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 md:py-32 border-2 border-dashed rounded-2xl bg-muted/30">
            <p className="text-muted-foreground text-xl md:text-2xl font-semibold">Noch keine Reviews vorhanden.</p>
            <p className="text-muted-foreground/70 text-sm md:text-base mt-2">
              Bald findest du hier die neuesten Reviews und Tests.
            </p>
          </div>
        )}
      </section>

      {/* Top Rated Reviews */}
      {topRatedReviews.length > 0 && (
        <section className="space-y-8 md:space-y-10 lg:space-y-12 pt-8 md:pt-12 lg:pt-16">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-2 md:mb-3">
                Top Bewertungen
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl lg:text-2xl">
                Die besten Reviews unserer Redaktion
              </p>
            </div>
            <Link 
              href="/reviews?sort=score-desc" 
              className="hidden sm:flex items-center gap-2 text-sm md:text-base font-medium text-primary hover:text-primary/80 transition-colors group"
            >
              Alle Top-Reviews
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <div className="grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
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
      <div className="text-center py-12 md:py-16 lg:py-20">
        <Button
          asChild
          size="lg"
          className="rounded-full text-lg md:text-xl lg:text-2xl px-8 md:px-10 lg:px-12 py-6 md:py-7 lg:py-8 h-auto"
        >
          <Link href="/reviews">
            Alle Reviews entdecken
          </Link>
        </Button>
      </div>
    </div>
  );
}
