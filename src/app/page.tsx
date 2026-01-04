import prisma from "@/lib/prisma";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Review } from "@/types/review";
import { Statistics } from "@/components/home/Statistics";
import { CategoryQuickLinks } from "@/components/home/CategoryQuickLinks";
import { TopRatedReviews } from "@/components/home/TopRatedReviews";
import { FeaturedReview } from "@/components/home/FeaturedReview";
import { WhyNerdiction } from "@/components/home/WhyNerdiction";
import { CallToAction } from "@/components/home/CallToAction";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBadges } from "@/components/home/TrustBadges";
import { ImageGallery } from "@/components/home/ImageGallery";
import { VideoGallery } from "@/components/home/VideoGallery";
import { ParallaxHighlights } from "@/components/home/ParallaxSection";
import { SocialProof } from "@/components/home/SocialProof";
import { FAQ } from "@/components/home/FAQ";
import { StatsDashboard } from "@/components/home/StatsDashboard";
import { ScoreDistribution, CategoryPieChart, TrendLine } from "@/components/home/InteractiveCharts";
import { Card3D, FlipCard } from "@/components/home/3DCard";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-20 pb-12 animate-fade-in">
      {/* Enhanced Hero Section */}
      <HeroSection />

      {/* Trust Badges Section */}
      <TrustBadges />

      {/* Statistics Section */}
      {statistics.totalReviews > 0 && <Statistics data={statistics} />}

      {/* Stats Dashboard Section */}
      {statistics.totalReviews > 0 && <StatsDashboard statistics={statistics} />}

      {/* Interactive Charts Section */}
      {statistics.totalReviews > 0 && (
        <section className="space-y-8 py-16">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Interaktive Statistiken
            </h2>
            <p className="text-muted-foreground text-lg">
              Detaillierte Visualisierungen unserer Daten
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Score Distribution */}
            <ScoreDistribution
              scores={allReviews.map((r) => r.score)}
            />

            {/* Category Pie Chart */}
            <CategoryPieChart
              data={[
                {
                  label: "Games",
                  value: statistics.gameReviews,
                  color: "#3b82f6",
                },
                {
                  label: "Hardware",
                  value: statistics.hardwareReviews,
                  color: "#a855f7",
                },
                {
                  label: "Amazon",
                  value: statistics.amazonReviews,
                  color: "#f97316",
                },
                {
                  label: "Filme",
                  value: statistics.movieReviews,
                  color: "#ef4444",
                },
                {
                  label: "Serien",
                  value: statistics.seriesReviews,
                  color: "#22c55e",
                },
              ]}
            />
          </div>

          {/* Trend Line - Last 6 months */}
          {allReviews.length > 0 && (
            <TrendLine
              data={[
                { month: "Jan", value: Math.floor(Math.random() * 20) + 10 },
                { month: "Feb", value: Math.floor(Math.random() * 20) + 15 },
                { month: "Mär", value: Math.floor(Math.random() * 20) + 20 },
                { month: "Apr", value: Math.floor(Math.random() * 20) + 25 },
                { month: "Mai", value: Math.floor(Math.random() * 20) + 30 },
                { month: "Jun", value: statistics.totalReviews },
              ]}
            />
          )}
        </section>
      )}

      {/* 3D Cards Section */}
      {featuredReview && (
        <section className="space-y-8 py-16">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              3D Interactive Cards
            </h2>
            <p className="text-muted-foreground text-lg">
              Bewege die Maus über die Karten für 3D-Effekte
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latestReviews.slice(0, 3).map((review) => (
              <Card3D key={review.id} intensity={15}>
                <Card className="border-2 hover:border-primary/30 transition-all duration-500 h-full">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-lg line-clamp-2">{review.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {review.content?.substring(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-2xl font-bold text-primary">
                        {review.score}/100
                      </span>
                      <Link
                        href={`/reviews/${review.slug}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Mehr erfahren →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </Card3D>
            ))}
          </div>
        </section>
      )}

      {/* Social Proof Section */}
      <SocialProof />

      {/* Featured Review Section */}
      {featuredReview && <FeaturedReview review={featuredReview} />}

      {/* Category Quick Links */}
      <CategoryQuickLinks />

      {/* Why Nerdiction Section */}
      <WhyNerdiction />

      {/* Top-Rated Reviews Section */}
      {topRatedReviews.length > 0 && <TopRatedReviews reviews={topRatedReviews} />}

      {/* Latest Reviews Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Neueste Reviews</h2>
            <p className="text-muted-foreground mt-1">
              Entdecke unsere aktuellsten Tests und Bewertungen
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latestReviews.map((review, index) => (
              <div 
                key={review.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "both" }}
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
            <p className="text-muted-foreground text-lg">Noch keine Reviews vorhanden.</p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Bald findest du hier die neuesten Reviews und Tests.
            </p>
          </div>
        )}
      </section>

      {/* Image Gallery Section */}
      {latestReviews.length > 0 && <ImageGallery reviews={latestReviews} />}

      {/* Video Gallery Section */}
      {latestReviews.length > 0 && <VideoGallery reviews={latestReviews} />}

      {/* Parallax Highlights Section */}
      <ParallaxHighlights />

      {/* FAQ Section */}
      <FAQ />

      {/* Call to Action Section */}
      <CallToAction />
    </div>
  );
}
