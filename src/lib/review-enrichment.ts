/**
 * Enrich a review with SEO metadata, tags, and AI-generated comments.
 * Used by POST /api/reviews/[id]/enrich and the backfill cron.
 */

import prisma from "@/lib/prisma";
import { generateSEOMetadata } from "@/lib/seo-generation";
import { generateAndAttachTagsForReview } from "@/lib/tag-generation";
import { generateAndSaveCommentsForReview } from "@/lib/comment-generation";

export interface EnrichReviewResult {
  success: boolean;
  reviewId: string;
  seo?: boolean;
  tags?: boolean;
  comments?: boolean;
  error?: string;
}

/**
 * Load a review by ID and run SEO, tags, and comments generation.
 * Does not throw; returns result with success and optional error.
 */
export async function enrichReviewById(reviewId: string): Promise<EnrichReviewResult> {
  const result: EnrichReviewResult = { success: true, reviewId };

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      score: true,
      pros: true,
      cons: true,
      metaDescription: true,
      metaKeywords: true,
      metadata: true,
      _count: { select: { comments: true } },
    },
  });

  if (!review) {
    return { success: false, reviewId, error: "Review not found" };
  }

  const title = review.title;
  const content = review.content || "";
  const category = review.category;
  const score = review.score;
  const pros = review.pros ?? [];
  const cons = review.cons ?? [];

  try {
    if (!review.metaDescription || !review.metaKeywords?.trim()) {
      const seoMeta = await generateSEOMetadata(title, content, category);
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          metaDescription: seoMeta.metaDescription,
          metaKeywords: seoMeta.metaKeywords,
        },
      });
      result.seo = true;
    }
  } catch (e) {
    console.warn("Enrich SEO failed for review", reviewId, e);
  }

  try {
    const metadata = (review.metadata as { genres?: string[]; platforms?: string[] }) ?? {};
    await generateAndAttachTagsForReview(reviewId, {
      reviewTitle: title,
      category,
      score,
      metadata,
      contentExcerpt: content.substring(0, 500),
    });
    result.tags = true;
  } catch (e) {
    console.warn("Enrich tags failed for review", reviewId, e);
  }

  try {
    const commentCount = review._count?.comments ?? 0;
    if (commentCount === 0) {
      await generateAndSaveCommentsForReview(reviewId, {
        reviewTitle: title,
        score,
        pros,
        cons,
        category,
      });
      result.comments = true;
    }
  } catch (e) {
    console.warn("Enrich comments failed for review", reviewId, e);
  }

  return result;
}
