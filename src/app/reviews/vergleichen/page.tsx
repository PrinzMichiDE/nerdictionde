import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { ScoreBlock } from "@/components/shared/ScoreBlock";
import { ProsCons } from "@/components/shared/ProsCons";
import { getCategoryStyle, getVerdict } from "@/lib/review-category";
import { ArrowLeft } from "lucide-react";
import {
  parseCompareIds,
  getSpecsUnion,
  formatPriceHistoryForDisplay,
  getYouTubeVideos,
  computeScoreCompareData,
} from "@/lib/review-compare";
import type { ReviewShape, SpecRow, PricePoint, YouTubeVideo } from "@/lib/review-compare-types";
import { ReviewCompareGallery } from "@/components/reviews/compare/ReviewCompareGallery";
import { ReviewCompareVideos } from "@/components/reviews/compare/ReviewCompareVideos";
import { ReviewComparePriceChart } from "@/components/reviews/compare/ReviewComparePriceChart";
import { ReviewCompareScoreCompare } from "@/components/reviews/compare/ReviewCompareScoreCompare";
import { ShareButtons } from "@/components/ui/ShareButtons";

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

  const isSingle = reviews.length === 1;
  const specsUnion = getSpecsUnion(reviews);
  const priceHistories = reviews.map((r) => formatPriceHistoryForDisplay(r.priceHistory));
  const youtubeVideos = reviews.map((r) => getYouTubeVideos(r.youtubeVideos));
  const scoreCompareData = computeScoreCompareData(reviews);

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-8 px-4">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/reviews"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <ArrowLeft className="size-4" />
          Zurück zu allen Reviews
        </Link>
        <ShareButtons
          contentType="review"
          contentId={reviews[0]?.id || "compare"}
          title={reviews.map((r) => r.title).join(" vs. ")}
          url={typeof window !== "undefined" ? window.location.href : ""}
          variant="inline"
        />
      </header>

      <div className="space-y-3">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
          Reviews vergleichen
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Bis zu drei Tests direkt gegenüberstellen: Wertung, Specs, Pros & Cons, Preisverlauf, Screenshots und Videos.
        </p>
      </div>

      {isSingle && (
        <SingleReviewView review={reviews[0]} />
      )}

      {!isSingle && (
        <CompareView
          reviews={reviews}
          specsUnion={specsUnion}
          priceHistories={priceHistories}
          youtubeVideos={youtubeVideos}
          scoreCompareData={scoreCompareData}
        />
      )}

      {reviews.length > 0 && (
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Zum Test lesen:{reviews
            .map((r) => (
              <span key={r.id} className="ml-1 font-medium text-foreground">
                &ldquo;{r.title}&rdquo;
              </span>
            ))}
        </p>
      )}
    </div>
  );
}

function SingleReviewView({ review }: { review: ReviewShape }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      <Link
        href={`/reviews/${review.slug}`}
        className="font-serif text-xl font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors block mb-4"
      >
        {review.title}
      </Link>
      <p className="text-muted-foreground">
        Nur ein Test im Vergleich. Fügen Sie über die Review-Seite weitere Tests hinzu (maximal 3).
      </p>
    </div>
  );
}

function CompareView({
  reviews,
  specsUnion,
  priceHistories,
  youtubeVideos,
  scoreCompareData,
}: {
  reviews: ReviewShape[];
  specsUnion: SpecRow[][];
  priceHistories: PricePoint[][];
  youtubeVideos: YouTubeVideo[][];
  scoreCompareData: ReturnType<typeof computeScoreCompareData>;
}) {
  return (
    <>
      <section className="grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        {reviews.map((review, index) => (
          <ReviewCompareCard
            key={review.id}
            review={review}
            specs={specsUnion[index]}
            priceHistory={priceHistories[index]}
            videos={youtubeVideos[index]}
            index={index}
          />
        ))}

        <div className="col-span-full rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-2xl font-semibold tracking-tight mb-4">
            Wertungsvergleich
          </h2>
          <ReviewCompareScoreCompare
            scores={scoreCompareData.scores}
            labels={scoreCompareData.labels}
            average={scoreCompareData.average}
            diffs={scoreCompareData.diffs}
          />
        </div>
      </section>
    </>
  );
}

function ReviewCompareCard({
  review,
  specs,
  priceHistory,
  videos,
  index,
}: {
  review: ReviewShape;
  specs: SpecRow[];
  priceHistory: PricePoint[];
  videos: YouTubeVideo[];
  index: number;
}) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "specs" | "prices" | "media">("overview");

  interface Tab {
    id: "overview" | "specs" | "prices" | "media";
    label: string;
    disabled?: boolean;
  }

  const allTabs: Tab[] = [
    { id: "overview", label: "Übersicht" },
    { id: "specs", label: "Specs", disabled: specs.length === 0 },
    { id: "prices", label: "Preise", disabled: priceHistory.length === 0 && review.deals.length === 0 },
    { id: "media", label: "Medien", disabled: review.images.length === 0 && videos.length === 0 },
  ];

  const tabs = allTabs.filter((t) => !t.disabled);

  return (
    <article className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      <div className="aspect-[16/9] w-full bg-muted relative overflow-hidden">
        {review.images?.[0] ? (
          <img
            src={review.images[0]}
            alt={review.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Kein Bild
          </div>
        )}
        <div className="absolute right-4 top-4 flex flex-col items-center gap-1.5 rounded-sm bg-black/55 px-3.5 py-3 backdrop-blur-sm">
          <ScoreBlock score={review.score} className="w-16 h-16 p-1" />
          <span className="text-[0.625rem] font-medium text-white/80">
            {getVerdict(review.score)}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/reviews/${review.slug}`}
            className="font-serif text-xl font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors"
          >
            {review.title}
          </Link>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
            {getCategoryStyle(review.category).label}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground space-y-2 md:space-y-0 md:flex-nowrap">
          <span>
            {review.releaseDate
              ? review.releaseDate.toLocaleDateString("de-DE")
              : "–"}
          </span>
          <span className="text-right font-semibold tabular-nums">
            {review.score}/100
          </span>
        </div>

        <nav className="flex gap-1 border-b border-border" aria-label="Vergleichsbereiche">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-t transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === tab.id
                  ? "bg-background text-foreground border-b-2 border-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${index}-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div id={`panel-${index}-overview`} role="tabpanel" aria-labelledby={`tab-${index}-overview`} className={activeTab === "overview" ? "block" : "hidden"}>
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vorteile</h3>
              <ProsCons pros={review.pros} cons={[]} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nachteile</h3>
              <ProsCons pros={[]} cons={review.cons} />
            </div>
          </div>
        </div>

        <div id={`panel-${index}-specs`} role="tabpanel" aria-labelledby={`tab-${index}-specs`} className={activeTab === "specs" ? "block" : "hidden"}>
          {specs.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <tbody className="text-muted-foreground divide-y divide-border">
                  {specs.map((row) => (
                    <tr key={row.label} className="hover:bg-muted/50">
                      <td className="py-3 w-1/3 font-medium text-foreground">
                        {row.label}
                      </td>
                      <td className="py-3">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-muted-foreground text-center">Keine technischen Daten verfügbar</p>
          )}
        </div>

        <div id={`panel-${index}-prices`} role="tabpanel" aria-labelledby={`tab-${index}-prices`} className={activeTab === "prices" ? "block" : "hidden"}>
          <ReviewComparePriceChart priceHistory={priceHistory} deals={review.deals} />
        </div>

        <div id={`panel-${index}-media`} role="tabpanel" aria-labelledby={`tab-${index}-media`} className={activeTab === "media" ? "block" : "hidden"}>
          <div className="mt-4 space-y-4">
            <ReviewCompareGallery images={review.images} title={review.title} />
            <ReviewCompareVideos videos={videos} title={review.title} />
          </div>
        </div>
      </div>
    </article>
  );
}

import React from "react";