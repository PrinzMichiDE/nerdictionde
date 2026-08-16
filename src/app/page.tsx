import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Review } from "@/types/review";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { StatsBar } from "@/components/home/StatsBar";
import { TrustBadges } from "@/components/home/TrustBadges";
import { FeaturedSpotlight } from "@/components/home/FeaturedSpotlight";
import { LatestReviews } from "@/components/home/LatestReviews";
import { VideoGallery } from "@/components/home/VideoGallery";
import { CategoriesShowcase } from "@/components/home/CategoriesShowcase";
import { DataSources } from "@/components/home/DataSources";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { ComparisonTable } from "@/components/home/ComparisonTable";
import { Leaderboard } from "@/components/home/Leaderboard";
import { TestimonialsGrid } from "@/components/home/TestimonialsGrid";
import { VerdictTicker } from "@/components/home/VerdictTicker";
import { FAQAccordion } from "@/components/home/FAQAccordion";
import { CTASection } from "@/components/home/CTASection";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { generateItemListSchema, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Nerdiction - Professional Game & Hardware Reviews" },
  description:
    "Die Plattform für detaillierte Hardware- und Game-Reviews für fundierte Kaufentscheidungen. Unabhängige Tests zu Games, Filmen und Serien.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const highlightCategories = ["game", "movie", "series"];

  let latestReviews: Review[] = [];
  let topRatedReviews: Review[] = [];
  let featuredReview: Review | null = null;
  let stats = {
    totalReviews: 0,
    averageScore: 0,
    gameReviews: 0,
    movieReviews: 0,
    seriesReviews: 0,
  };

  try {
    featuredReview = (await prisma.review.findFirst({
      where: { status: "published", category: { in: highlightCategories } },
      orderBy: { score: "desc" },
    })) as unknown as Review | null;

    const excludedIds = new Set<string>();
    if (featuredReview) excludedIds.add(featuredReview.id);

    const latestReviewsQuery: Prisma.ReviewFindManyArgs = {
      where: {
        status: "published",
        category: { in: highlightCategories },
        ...(featuredReview ? { id: { not: featuredReview.id } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    };

    const topRatedQuery: Prisma.ReviewFindManyArgs = {
      where: {
        status: "published",
        category: { in: highlightCategories },
        ...(excludedIds.size > 0 ? { id: { notIn: Array.from(excludedIds) } } : {}),
      },
      orderBy: { score: "desc" },
      take: 6,
    };

    const [latestResult, topRatedResult, countResult] = await Promise.all([
      prisma.review.findMany(latestReviewsQuery),
      prisma.review.findMany(topRatedQuery),
      Promise.all([
        prisma.review.count({ where: { status: "published", category: { in: highlightCategories } } }),
        prisma.review.aggregate({
          where: { status: "published", category: { in: highlightCategories } },
          _avg: { score: true },
        }),
        prisma.review.count({ where: { status: "published", category: "game" } }),
        prisma.review.count({ where: { status: "published", category: "movie" } }),
        prisma.review.count({ where: { status: "published", category: "series" } }),
      ]),
    ]);

    latestReviews = latestResult as unknown as Review[];
    topRatedReviews = topRatedResult as unknown as Review[];
    const [total, avg, games, movies, series] = countResult;
    stats = {
      totalReviews: total,
      averageScore: Math.round((avg._avg.score ?? 0) * 10) / 10,
      gameReviews: games,
      movieReviews: movies,
      seriesReviews: series,
    };

    latestReviews.forEach((r) => excludedIds.add(r.id));
    topRatedReviews = topRatedReviews.filter((r) => !excludedIds.has(r.id));
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  const allFeatured = [featuredReview, ...latestReviews, ...topRatedReviews].filter(
    Boolean
  ) as Review[];
  const itemListSchema = generateItemListSchema(
    allFeatured.slice(0, 12).map((r) => ({
      name: r.title,
      url: `${getSiteUrl()}/reviews/${r.slug}`,
      image: r.images?.[0],
    }))
  );

  const videoReviews = Array.from(
    new Map([...latestReviews, ...topRatedReviews].map((r) => [r.id, r])).values()
  );

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Hero */}
      <Hero />

      {/* Marquee */}
      <Marquee />

      {/* Content-Sektionen */}
      <div className="mx-auto max-w-7xl space-y-24 px-4 pt-16 pb-16 md:space-y-32 md:px-6 md:pt-24 md:pb-24 lg:space-y-40 lg:px-8 lg:pt-32 xl:px-12">
        {/* Statistiken */}
        <StatsBar stats={stats} />

        {/* Vertrauens-Ribbon */}
        <TrustBadges />

        {/* Review der Woche */}
        {featuredReview ? (
          <FeaturedSpotlight review={featuredReview} />
        ) : (
          <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-16 md:px-12 md:py-20">
            <div className="absolute inset-0 bg-mesh opacity-60" aria-hidden="true" />
            <div className="relative z-10 flex flex-col items-center gap-6 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                <Sparkles className="size-7 text-primary" />
              </span>
              <h2 className="max-w-xl font-serif text-3xl md:text-4xl font-semibold tracking-tight">
                Bald erscheinen hier die ersten Reviews
              </h2>
              <p className="max-w-lg text-muted-foreground">
                Unsere Redaktion arbeitet mit Hochdruck an den ersten ausführlichen Tests.
              </p>
              <Button asChild size="lg" className="shine group relative rounded-full px-8">
                <Link href="/reviews" className="relative z-[2] inline-flex items-center gap-2">
                  Alle Reviews entdecken
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* Neueste Reviews */}
        <LatestReviews reviews={latestReviews} />

        {/* Video-Reviews */}
        <VideoGallery reviews={videoReviews} />

        {/* Kategorien */}
        <CategoriesShowcase
          counts={{
            game: stats.gameReviews,
            movie: stats.movieReviews,
            series: stats.seriesReviews,
          }}
        />

        {/* Datenquellen */}
        <DataSources />

        {/* Testmethode */}
        <ProcessSteps />

        {/* Warum Nerdiction */}
        <FeatureGrid />

        {/* Top-Rated Leaderboard */}
        <Leaderboard reviews={topRatedReviews} />

        {/* Vergleich */}
        <ComparisonTable />

        {/* Testimonials */}
        <TestimonialsGrid />

        {/* FAQ */}
        <FAQAccordion />

        {/* Verdict-Ticker */}
        <VerdictTicker reviews={videoReviews} />

        {/* Newsletter / CTA */}
        <CTASection />
      </div>
    </div>
  );
}
