import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getCategoryStyle, getVerdict } from "@/lib/review-category";
import { getSiteUrl } from "@/lib/seo";
import {
  parseCompareIds,
  getSpecsUnion,
  formatPriceHistoryForDisplay,
  getYouTubeVideos,
  computeScoreCompareData,
} from "@/lib/review-compare";
import type { ReviewShape } from "@/lib/review-compare-types";
import { ReviewCompareView } from "@/components/reviews/compare/ReviewCompareView";

export const metadata: Metadata = {
  title: "Reviews vergleichen",
  description:
    "Bis zu drei Nerdiction-Tests direkt gegenüberstellen: Wertung, Specs, Pros & Cons, Preisverlauf, Screenshots und Videos im Seitenvergleich.",
  alternates: {
    canonical: "/reviews/vergleichen",
  },
};

const fetchReviewBySlugCached = unstable_cache(
  async (slug: string): Promise<ReviewShape | null> => {
    const review = await prisma.review.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        score: true,
        pros: true,
        cons: true,
        images: true,
        releaseDate: true,
        specs: true,
        metadata: true,
        youtubeVideos: true,
        status: true,
        priceHistory: {
          orderBy: { recordedAt: "desc" },
          take: 5,
          select: {
            id: true,
            price: true,
            currency: true,
            source: true,
            url: true,
            recordedAt: true,
          },
        },
        deals: {
          where: { status: "active" },
          take: 3,
          select: {
            id: true,
            title: true,
            price: true,
            originalPrice: true,
            discount: true,
            currency: true,
            url: true,
            imageUrl: true,
            source: true,
            status: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!review || review.status !== "published") return null;

    return {
      id: review.id,
      title: review.title,
      slug: review.slug,
      category: review.category,
      score: review.score,
      pros: review.pros,
      cons: review.cons,
      images: review.images,
      releaseDate: review.releaseDate,
      specs: review.specs,
      metadata: review.metadata,
      youtubeVideos: review.youtubeVideos,
      priceHistory: review.priceHistory,
      deals: review.deals,
    };
  },
  ["review-compare"],
  { tags: ["reviews:compare"], revalidate: 60 }
);

async function fetchReviewsBySlugs(slugs: string[]): Promise<ReviewShape[]> {
  const results = await Promise.all(slugs.map((slug) => fetchReviewBySlugCached(slug)));
  return results.filter((r): r is ReviewShape => r !== null);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; a?: string; b?: string; c?: string }>;
}) {
  const { ids: idsParam, a: slugA, b: slugB, c: slugC } = await searchParams;
  const slugs = parseCompareIds(idsParam, slugA, slugB, slugC);
  if (slugs.length === 0) notFound();

  const reviews = await fetchReviewsBySlugs(slugs);
  if (reviews.length === 0) notFound();

  if (reviews.length === 1) {
    const review = reviews[0];
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Review vergleichen</h1>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Link
            href={`/reviews/${review.slug}`}
            className="mb-4 block font-serif text-xl font-semibold leading-snug transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {review.title}
          </Link>
          <p className="text-muted-foreground">
            Nur ein Test im Vergleich. Füge über die Review-Seite weitere Tests hinzu (maximal 3).
          </p>
        </div>
      </div>
    );
  }

  const specsUnion = getSpecsUnion(reviews);
  const allSpecLabels = Array.from(
    new Set(specsUnion.flatMap((rows) => rows.map((row) => row.label)))
  );
  const priceHistories = reviews.map((r) => formatPriceHistoryForDisplay(r.priceHistory));
  const youtubeVideos = reviews.map((r) => getYouTubeVideos(r.youtubeVideos));
  const scoreCompareData = computeScoreCompareData(reviews);
  const siteUrl = getSiteUrl();
  const comparePath = `/reviews/vergleichen?ids=${reviews.map((r) => r.slug).join(",")}`;
  const compareUrl = `${siteUrl}${comparePath}`;
  const shareTitle = `Vergleich: ${reviews.map((r) => r.title).join(" vs. ")}`;
  const shareDescription = `${reviews.length} Nerdiction-Tests im direkten Vergleich: Wertung, Pros/Cons, Specs und Preise.`;

  const viewModels = reviews.map((review, index) => ({
    review,
    style: getCategoryStyle(review.category),
    verdict: getVerdict(review.score),
    formattedDate: review.releaseDate
      ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(review.releaseDate)
      : null,
    specs: specsUnion[index] ?? [],
    priceHistory: priceHistories[index] ?? [],
    videos: youtubeVideos[index] ?? [],
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <ReviewCompareView
        reviews={viewModels}
        allSpecLabels={allSpecLabels}
        scoreCompare={scoreCompareData}
        compareUrl={compareUrl}
        shareTitle={shareTitle}
        shareDescription={shareDescription}
        shareImage={reviews.find((r) => r.images?.[0])?.images?.[0]}
      />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Zum Test lesen:{" "}
        {reviews.map((r, i) => (
          <span key={r.id}>
            {i > 0 ? ", " : ""}
            <Link href={`/reviews/${r.slug}`} className="font-medium text-foreground hover:underline">
              {r.title}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
