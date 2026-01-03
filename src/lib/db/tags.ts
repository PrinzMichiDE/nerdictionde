import prisma from "@/lib/prisma";
import { Review } from "@/types/review";
import { extractTags as extractTagsFromReview } from "../tags";

/**
 * Sync tags from review metadata to database
 * No database changes needed - uses existing review data
 */
export async function syncTagsFromReviews() {
  const reviews = await prisma.review.findMany({
    where: { status: "published" },
  });

  const tagMap = new Map<string, { name: string; category?: string }>();

  // Extract all tags from reviews
  reviews.forEach((review) => {
    const tags = extractTagsFromReview(review as Review);
    tags.forEach((tag) => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, {
          name: tag,
          category: review.category,
        });
      }
    });
  });

  // Create or update tags in database
  for (const [tagName, tagData] of tagMap.entries()) {
    const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: {
        name: tagName,
        slug,
        category: tagData.category,
        reviewCount: 0,
      },
    });
  }

  // Update review tags relationships
  for (const review of reviews) {
    const tags = extractTagsFromReview(review as Review);
    const tagSlugs = tags.map((tag) =>
      tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    );

    // Get tag IDs
    const dbTags = await prisma.tag.findMany({
      where: { slug: { in: tagSlugs } },
    });

    // Remove old tags
    await prisma.reviewTag.deleteMany({
      where: { reviewId: review.id },
    });

    // Add new tags
    await prisma.reviewTag.createMany({
      data: dbTags.map((tag) => ({
        reviewId: review.id,
        tagId: tag.id,
      })),
      skipDuplicates: true,
    });
  }

  // Update tag counts
  const tagCounts = await prisma.reviewTag.groupBy({
    by: ["tagId"],
    _count: true,
  });

  for (const count of tagCounts) {
    await prisma.tag.update({
      where: { id: count.tagId },
      data: { reviewCount: count._count },
    });
  }
}

/**
 * Get tags for a review from database
 */
export async function getReviewTags(reviewId: string) {
  const reviewTags = await prisma.reviewTag.findMany({
    where: { reviewId },
    include: { tag: true },
  });

  return reviewTags.map((rt) => rt.tag);
}

/**
 * Get all tags with counts
 */
export async function getAllTagsWithCounts() {
  return prisma.tag.findMany({
    orderBy: { reviewCount: "desc" },
  });
}
