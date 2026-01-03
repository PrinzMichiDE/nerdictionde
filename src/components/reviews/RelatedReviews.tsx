import prisma from "@/lib/prisma";
import { ReviewCard } from "./ReviewCard";
import { Review } from "@/types/review";

interface RelatedReviewsProps {
  currentReviewId: string;
  category: string;
  score: number;
}

export async function RelatedReviews({ 
  currentReviewId, 
  category, 
  score 
}: RelatedReviewsProps) {
  // Find related reviews directly in the server component
  const relatedReviews = (await prisma.review.findMany({
    where: {
      id: { not: currentReviewId },
      category: category,
      status: "published",
      score: {
        gte: Math.max(0, score - 15),
        lte: Math.min(100, score + 15),
      },
    },
    take: 3, // 3 columns looks better on most screens
    orderBy: {
      createdAt: "desc",
    },
  })) as unknown as Review[];

  // Fallback to latest reviews of same category if not enough found
  if (relatedReviews.length < 3) {
    const additional = (await prisma.review.findMany({
      where: {
        id: { 
          notIn: [currentReviewId, ...relatedReviews.map(r => r.id)] 
        },
        category: category,
        status: "published",
      },
      take: 3 - relatedReviews.length,
      orderBy: {
        createdAt: "desc",
      },
    })) as unknown as Review[];
    
    relatedReviews.push(...additional);
  }

  if (relatedReviews.length === 0) return null;

  return (
    <section className="space-y-8 pt-12 border-t mt-12" aria-labelledby="related-reviews-heading">
      <div className="flex flex-col space-y-2">
        <h2 id="related-reviews-heading" className="text-3xl font-bold tracking-tight">
          Das könnte dich auch interessieren
        </h2>
        <p className="text-muted-foreground">
          Weitere Reviews aus der Kategorie{" "}
          <span className="capitalize font-semibold text-foreground">{category}</span>.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {relatedReviews.map((review) => (
          <div key={review.id} role="listitem">
            <ReviewCard review={review} />
          </div>
        ))}
      </div>
    </section>
  );
}

