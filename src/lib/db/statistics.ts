import prisma from "@/lib/prisma";

/**
 * Get comprehensive statistics
 * All calculated from existing data - no new tables needed
 */
export async function getStatistics() {
  const [
    totalReviews,
    publishedReviews,
    gameReviews,
    hardwareReviews,
    amazonReviews,
    allScores,
    reviewsWithAffiliate,
  ] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { status: "published" } }),
    prisma.review.count({ where: { status: "published", category: "game" } }),
    prisma.review.count({
      where: { status: "published", category: "hardware" },
    }),
    prisma.review.count({
      where: { status: "published", category: "amazon" },
    }),
    prisma.review.findMany({
      where: { status: "published" },
      select: { score: true },
    }),
    prisma.review.count({
      where: { status: "published", affiliateLink: { not: null } },
    }),
  ]);

  const averageScore =
    allScores.length > 0
      ? allScores.reduce((sum, r) => sum + r.score, 0) / allScores.length
      : 0;

  // Score distribution
  const scoreDistribution = {
    excellent: allScores.filter((r) => r.score >= 90).length,
    great: allScores.filter((r) => r.score >= 80 && r.score < 90).length,
    good: allScores.filter((r) => r.score >= 70 && r.score < 80).length,
    average: allScores.filter((r) => r.score >= 60 && r.score < 70).length,
    belowAverage: allScores.filter((r) => r.score < 60).length,
  };

  // Reviews by month
  const reviewsByMonth = await prisma.review.groupBy({
    by: ["createdAt"],
    where: { status: "published" },
    _count: true,
  });

  // Top tags (if tags are synced)
  const topTags = await prisma.tag.findMany({
    orderBy: { reviewCount: "desc" },
    take: 10,
  });

  // Most viewed reviews
  const mostViewed = await prisma.review.findMany({
    where: { status: "published" },
    orderBy: { viewCount: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      score: true,
      viewCount: true,
    },
  });

  return {
    totalReviews,
    publishedReviews,
    categoryStats: {
      game: gameReviews,
      hardware: hardwareReviews,
      amazon: amazonReviews,
    },
    averageScore,
    scoreDistribution,
    reviewsByMonth,
    topTags,
    mostViewed,
    reviewsWithAffiliate,
  };
}

/**
 * Increment view count for a review
 */
export async function incrementViewCount(reviewId: string) {
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });
}
