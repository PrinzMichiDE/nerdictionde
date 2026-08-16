import prisma from "@/lib/prisma";
import { Review } from "@/types/review";
import { ReviewHero } from "@/components/home/ReviewHero";
import { LargeReviewCard } from "@/components/home/LargeReviewCard";
import { CategoryFilter } from "@/components/home/CategoryFilter";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch latest reviews
  let latestReviews: Review[] = [];
  let topRatedReviews: Review[] = [];
  let featuredReview: Review | null = null;

  const highlightCategories = ["game", "movie", "series"];

  try {
    // Fetch featured review first (highest scored review), exclude product/amazon
    featuredReview = (await prisma.review.findFirst({
      where: { status: "published", category: { in: highlightCategories } },
      orderBy: { score: "desc" },
    })) as unknown as Review | null;

    // Fetch latest reviews, excluding featured review and product/amazon
    const latestReviewsQuery: any = {
      where: { status: "published", category: { in: highlightCategories } },
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
        category: { in: highlightCategories },
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
      <section className="space-y-8 md:space-y-10">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <span className="kicker text-primary">Aktuelle Tests</span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mt-1">
              Neueste Reviews
            </h2>
          </div>
          <Link
            href="/reviews"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group pb-1"
          >
            Alle ansehen
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {latestReviews.length > 0 ? (
          <div className="grid gap-8 md:gap-10 md:grid-cols-2 lg:grid-cols-3">
            {latestReviews.map((review, index) => (
              <LargeReviewCard
                key={review.id}
                review={review}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed rounded-md bg-muted/30">
            <p className="text-muted-foreground text-xl font-semibold">Noch keine Reviews vorhanden.</p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Bald findest du hier die neuesten Reviews und Tests.
            </p>
          </div>
        )}
      </section>

      {/* Top Rated Reviews */}
      {topRatedReviews.length > 0 && (
        <section className="space-y-8 md:space-y-10">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <span className="kicker text-primary">Redaktions-Favoriten</span>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mt-1">
                Top Bewertungen
              </h2>
            </div>
            <Link
              href="/reviews?sort=score-desc"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group pb-1"
            >
              Alle Top-Reviews
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          <div className="grid gap-8 md:gap-10 md:grid-cols-2 lg:grid-cols-3">
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
      <div className="border-t border-border pt-10 text-center">
        <Button asChild size="lg" variant="outline">
          <Link href="/reviews">
            Alle Reviews entdecken
          </Link>
        </Button>
      </div>
    </div>
  );
}
