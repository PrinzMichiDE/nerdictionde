import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/analytics/stats
 * Returns aggregate stats for charts and dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    const focusCategories = ["game", "movie", "series"];
    const publishedWhere = { status: "published" as const, category: { in: focusCategories } };

    const [
      totalReviews,
      byCategory,
      scoreDistribution,
      reviewsWithScores,
      recentMonths,
    ] = await Promise.all([
      prisma.review.count({ where: publishedWhere }),
      prisma.review.groupBy({
        by: ["category"],
        where: publishedWhere,
        _count: { id: true },
      }),
      prisma.review.groupBy({
        by: ["score"],
        where: publishedWhere,
        _count: { id: true },
      }),
      prisma.review.findMany({
        where: publishedWhere,
        select: { score: true, category: true, createdAt: true, id: true, title: true, slug: true, comments: { select: { id: true } } },
      }),
      prisma.review.findMany({
        where: publishedWhere,
        select: { createdAt: true, score: true },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);

    const categoryDistribution = byCategory
      .filter((c) => focusCategories.includes(c.category))
      .map((c) => ({
        name: c.category,
        value: c._count.id,
      }));

    const scoreBuckets: Record<string, number> = {
      "0-19": 0,
      "20-39": 0,
      "40-59": 0,
      "60-79": 0,
      "80-100": 0,
    };
    scoreDistribution.forEach(({ score, _count }) => {
      if (score < 20) scoreBuckets["0-19"] += _count.id;
      else if (score < 40) scoreBuckets["20-39"] += _count.id;
      else if (score < 60) scoreBuckets["40-59"] += _count.id;
      else if (score < 80) scoreBuckets["60-79"] += _count.id;
      else scoreBuckets["80-100"] += _count.id;
    });
    const scoreDistributionChart = Object.entries(scoreBuckets).map(([label, value]) => ({ label, value }));

    const avgScore =
      reviewsWithScores.length > 0
        ? reviewsWithScores.reduce((s, r) => s + r.score, 0) / reviewsWithScores.length
        : 0;

    const byMonth: Record<string, { count: number; avgScore: number; totalScore: number }> = {};
    recentMonths.forEach((r) => {
      const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { count: 0, avgScore: 0, totalScore: 0 };
      byMonth[key].count += 1;
      byMonth[key].totalScore += r.score;
    });
    Object.keys(byMonth).forEach((k) => {
      byMonth[k].avgScore = byMonth[k].totalScore / byMonth[k].count;
    });
    const scoreTrends = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, count: data.count, avgScore: Math.round(data.avgScore * 10) / 10 }));

    const topByComments = [...reviewsWithScores]
      .sort((a, b) => b.comments.length - a.comments.length)
      .slice(0, 10)
      .map((r) => ({ id: r.id, title: r.title, slug: r.slug, category: r.category, commentCount: r.comments.length }));

    return NextResponse.json({
      totalReviews,
      categoryDistribution,
      scoreDistribution: scoreDistributionChart,
      averageScore: Math.round(avgScore * 10) / 10,
      scoreTrends,
      topByComments,
    });
  } catch (error) {
    console.error("GET /api/analytics/stats error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
