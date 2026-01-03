import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { AnimatedText } from "@/components/shared/AnimatedText";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Gamepad2,
  Cpu,
  ShoppingCart,
  Star,
  Calendar,
  Award,
} from "lucide-react";
import { Review } from "@/types/review";
import { extractTags, getTagCounts } from "@/lib/tags";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";

export const metadata: Metadata = {
  title: "Statistiken & Analytics - Nerdiction",
  description: "Umfassende Statistiken und Analytics zu unseren Reviews, Kategorien und Bewertungen.",
  alternates: {
    canonical: `${baseUrl}/statistics`,
  },
  openGraph: {
    title: "Statistiken & Analytics | Nerdiction",
    description: "Umfassende Statistiken und Analytics zu unseren Reviews.",
    url: `${baseUrl}/statistics`,
    type: "website",
  },
};

export default async function StatisticsPage() {
  const allReviews = (await prisma.review.findMany({
    where: { status: "published" },
  })) as unknown as Review[];

  // Calculate statistics
  const totalReviews = allReviews.length;
  const averageScore =
    allReviews.reduce((sum, r) => sum + r.score, 0) / totalReviews || 0;

  const categoryStats = {
    game: allReviews.filter((r) => r.category === "game").length,
    hardware: allReviews.filter((r) => r.category === "hardware").length,
    amazon: allReviews.filter((r) => r.category === "amazon").length,
  };

  const scoreDistribution = {
    excellent: allReviews.filter((r) => r.score >= 90).length,
    great: allReviews.filter((r) => r.score >= 80 && r.score < 90).length,
    good: allReviews.filter((r) => r.score >= 70 && r.score < 80).length,
    average: allReviews.filter((r) => r.score >= 60 && r.score < 70).length,
    belowAverage: allReviews.filter((r) => r.score < 60).length,
  };

  // Get top tags
  const tagCounts = getTagCounts(allReviews);
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Get reviews by month
  const reviewsByMonth: Record<string, number> = {};
  allReviews.forEach((review) => {
    const month = new Date(review.createdAt).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
    });
    reviewsByMonth[month] = (reviewsByMonth[month] || 0) + 1;
  });

  // Top rated reviews
  const topRated = allReviews
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Most recent reviews
  const mostRecent = allReviews
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <AnimatedSection direction="up">
        <div className="space-y-4">
          <AnimatedText variant="h1" stagger className="text-4xl font-bold tracking-tight sm:text-5xl">
            Statistiken & Analytics
          </AnimatedText>
          <AnimatedText variant="p" delay={0.2} className="text-muted-foreground text-lg">
            Umfassende Übersicht über unsere Review-Plattform
          </AnimatedText>
        </div>
      </AnimatedSection>

      {/* Overview Cards */}
      <AnimatedSection direction="up" delay={0.1}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Reviews</CardTitle>
              <BarChart3 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Veröffentlichte Reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durchschnitts-Score</CardTitle>
              <Star className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averageScore.toFixed(1)}/100
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Über alle Reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kategorien</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-1">
                Games, Hardware, Amazon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Tags</CardTitle>
              <Award className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topTags.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Verschiedene Tags
              </p>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* Category Distribution */}
      <AnimatedSection direction="up" delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Verteilung nach Kategorien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryStats).map(([category, count]) => {
                const percentage = (count / totalReviews) * 100;
                const icons = {
                  game: Gamepad2,
                  hardware: Cpu,
                  amazon: ShoppingCart,
                };
                const Icon = icons[category as keyof typeof icons];

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="font-medium capitalize">{category}</span>
                      </div>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Score Distribution */}
      <AnimatedSection direction="up" delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5" />
              Score-Verteilung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(scoreDistribution).map(([range, count]) => {
                const labels: Record<string, string> = {
                  excellent: "Exzellent (90+)",
                  great: "Großartig (80-89)",
                  good: "Gut (70-79)",
                  average: "Durchschnitt (60-69)",
                  belowAverage: "Unter 60",
                };

                return (
                  <div
                    key={range}
                    className="text-center p-4 rounded-lg bg-muted/50 border"
                  >
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {labels[range]}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Top Tags */}
      <AnimatedSection direction="up" delay={0.4}>
        <Card>
          <CardHeader>
            <CardTitle>Top Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count]) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="px-3 py-1 capitalize"
                >
                  {tag} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Top Rated Reviews */}
      <AnimatedSection direction="up" delay={0.5}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-5" />
              Top Bewertete Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRated.map((review, index) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-semibold">{review.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {review.category}
                      </div>
                    </div>
                  </div>
                  <Badge variant="default" className="text-sm">
                    {review.score}/100
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  );
}
