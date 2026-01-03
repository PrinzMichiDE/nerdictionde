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
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { AnimatedCard } from "@/components/shared/AnimatedCard";
import { AnimatedText } from "@/components/shared/AnimatedText";

export default async function HomePage() {
  // Fetch latest reviews
  const latestReviews = (await prisma.review.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    take: 6,
  })) as unknown as Review[];

  // Fetch top-rated reviews
  const topRatedReviews = (await prisma.review.findMany({
    where: { status: "published" },
    orderBy: { score: "desc" },
    take: 6,
  })) as unknown as Review[];

  // Fetch featured review (highest scored review)
  const featuredReview = (await prisma.review.findFirst({
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

  const allScores = await prisma.review.findMany({
    where: { status: "published" },
    select: { score: true },
  });

  const averageScore =
    allScores.length > 0
      ? allScores.reduce((sum, review) => sum + review.score, 0) / allScores.length
      : 0;

  const statistics = {
    totalReviews,
    averageScore,
    gameReviews,
    hardwareReviews,
    amazonReviews,
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <AnimatedSection direction="fade" duration={0.8}>
        <section className="relative flex flex-col items-center justify-center space-y-6 text-center py-16 md:py-32 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.1),transparent_50%)] rounded-3xl" />
          
          <div className="relative z-10 space-y-6 px-4 max-w-4xl">
            <AnimatedText variant="h1" stagger delay={0.1} className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Willkommen bei{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Nerdiction
              </span>
            </AnimatedText>
            
            <AnimatedText variant="p" delay={0.3} className="max-w-[700px] mx-auto text-muted-foreground text-lg md:text-xl leading-relaxed">
              Professionelle Game- und Hardware-Reviews für fundierte Kaufentscheidungen.
            </AnimatedText>
            
            <AnimatedSection direction="up" delay={0.5} className="flex flex-wrap justify-center gap-4 pt-4">
              <Button asChild size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
                <Link href="/reviews">Alle Reviews</Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                asChild 
                className="rounded-full border-2 hover:bg-accent hover:border-accent-foreground/20 transition-all"
              >
                <Link href="/reviews?sort=score-desc">Top Reviews</Link>
              </Button>
            </AnimatedSection>
          </div>
        </section>
      </AnimatedSection>

      {/* Statistics Section */}
      {totalReviews > 0 && <Statistics data={statistics} />}

      {/* Featured Review Section */}
      {featuredReview && <FeaturedReview review={featuredReview} />}

      {/* Category Quick Links */}
      <CategoryQuickLinks />

      {/* Why Nerdiction Section */}
      <WhyNerdiction />

      {/* Top-Rated Reviews Section */}
      {topRatedReviews.length > 0 && <TopRatedReviews reviews={topRatedReviews} />}

      {/* Latest Reviews Section */}
      <AnimatedSection direction="up" delay={0.2}>
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <AnimatedText variant="h2" className="text-3xl font-bold tracking-tight">
                Neueste Reviews
              </AnimatedText>
              <AnimatedText variant="p" delay={0.1} className="text-muted-foreground mt-1">
                Entdecke unsere aktuellsten Tests und Bewertungen
              </AnimatedText>
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
                <AnimatedCard key={review.id} index={index} delay={0.2}>
                  <ReviewCard review={review} />
                </AnimatedCard>
              ))}
            </div>
          ) : (
            <AnimatedSection direction="fade">
              <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground text-lg">Noch keine Reviews vorhanden.</p>
                <p className="text-muted-foreground/70 text-sm mt-2">
                  Bald findest du hier die neuesten Reviews und Tests.
                </p>
              </div>
            </AnimatedSection>
          )}
        </section>
      </AnimatedSection>

      {/* Call to Action Section */}
      <CallToAction />
    </div>
  );
}
