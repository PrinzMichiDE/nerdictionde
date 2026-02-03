import { ReviewCard } from "./ReviewCard";
import { Review } from "@/types/review";
import { findRelatedReviews, getReviewsByIds } from "@/lib/related-reviews";
import prisma from "@/lib/prisma";

interface RelatedReviewsProps {
  currentReviewId: string;
  category: string;
  score: number;
}

export async function RelatedReviews({
  currentReviewId,
  category,
  score,
}: RelatedReviewsProps) {
  const current = await prisma.review.findUnique({
    where: { id: currentReviewId },
    select: {
      tags: { select: { tagId: true } },
      metadata: true,
    },
  });

  const tagIds = current?.tags?.map((t) => t.tagId) ?? [];
  const metadataGenres = (current?.metadata as { genres?: string[] } | null)?.genres ?? [];

  const relatedIds = await findRelatedReviews(
    { reviewId: currentReviewId, category, score, tagIds, metadataGenres },
    6
  );

  let relatedReviews = await getReviewsByIds(relatedIds);

  if (relatedReviews.length < 3) {
    const fallback = await prisma.review.findMany({
      where: {
        id: { notIn: [currentReviewId, ...relatedReviews.map((r) => r.id)] },
        category,
        status: "published",
      },
      take: 3 - relatedReviews.length,
      orderBy: { createdAt: "desc" },
    });
    relatedReviews = [...relatedReviews, ...fallback];
  }

  const toShow = relatedReviews.slice(0, 3) as unknown as Review[];

  if (toShow.length === 0) return null;

  return (
    <div className="space-y-8 pt-12 border-t mt-12">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Das könnte dich auch interessieren
        </h2>
        <p className="text-muted-foreground">
          Weitere Reviews aus der Kategorie <span className="capitalize font-semibold text-foreground">{category}</span>.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {toShow.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

