import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { ScoreBlock } from "@/components/shared/ScoreBlock";
import { ProsCons } from "@/components/shared/ProsCons";
import { SpecTable } from "@/components/shared/SpecTable";
import { getCategoryStyle, getVerdict } from "@/lib/review-category";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import {
  parseCompareIds,
  getSpecsUnion,
  formatPriceHistoryForDisplay,
  getYouTubeVideos,
  computeScoreCompareData,
} from "@/lib/review-compare";
import type { ReviewShape, SpecRow, PricePoint, YouTubeVideo } from "@/lib/review-compare-types";

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
  searchParams: Promise<{ ids?: string; a?: string; b?: string }>;
}) {
  const { ids: idsParam, a: slugA, b: slugB } = await searchParams;

  const slugs = parseCompareIds(idsParam, slugA, slugB);

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
        <ShareButton reviews={reviews} />
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
          <ScoreCompareEnhanced
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
          <Image
            src={review.images[0]}
            alt={review.title}
            fill
            className="object-cover"
            sizes="1280px"
            unoptimized
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
              ? format(new Date(review.releaseDate), "dd.MM.yyyy", { locale: de })
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
              <SpecTable specs={specs} />
            </div>
          ) : (
            <p className="mt-4 text-muted-foreground text-center">Keine technischen Daten verfügbar</p>
          )}
        </div>

        <div id={`panel-${index}-prices`} role="tabpanel" aria-labelledby={`tab-${index}-prices`} className={activeTab === "prices" ? "block" : "hidden"}>
          <PriceHistorySection priceHistory={priceHistory} deals={review.deals} />
        </div>

        <div id={`panel-${index}-media`} role="tabpanel" aria-labelledby={`tab-${index}-media`} className={activeTab === "media" ? "block" : "hidden"}>
          <MediaSection images={review.images} videos={videos} title={review.title} />
        </div>
      </div>
    </article>
  );
}

function ShareButton({ reviews }: { reviews: ReviewShape[] }) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = reviews.map((r) => r.title).join(" vs. ");
    const text = `Vergleich: ${title}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or error, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API failed
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      aria-label="Vergleich teilen"
    >
      <Share2 className="size-4" />
      {copied ? "Link kopiert!" : "Teilen"}
    </button>
  );
}

function PriceHistorySection({
  priceHistory,
  deals,
}: {
  priceHistory: PricePoint[];
  deals: ReviewShape["deals"];
}) {
  if (priceHistory.length === 0 && deals.length === 0) {
    return <p className="mt-4 text-muted-foreground text-center">Keine Preisdaten verfügbar</p>;
  }

  return (
    <div className="mt-4 space-y-4">
      {priceHistory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preisverlauf (letzte 5)</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {priceHistory.map((point, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
                <span className="text-muted-foreground">
                  {format(point.date, "dd.MM.yyyy", { locale: de })}
                </span>
                <span className="font-semibold tabular-nums">
                  {point.price.toFixed(2)} {point.currency}
                </span>
                <span className="text-xs text-muted-foreground">{point.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {deals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aktuelle Deals</h3>
          <div className="space-y-2">
            {deals.map((deal) => (
              <a
                key={deal.id}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                {deal.imageUrl && (
                  <Image
                    src={deal.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded object-cover"
                    unoptimized
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{deal.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {deal.originalPrice && deal.discount && (
                      <>
                        <span className="line-through">{deal.originalPrice.toFixed(2)} {deal.currency}</span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          -{deal.discount.toFixed(0)}%
                        </span>
                      </>
                    )}
                    <span className="font-semibold text-foreground">
                      {deal.price.toFixed(2)} {deal.currency}
                    </span>
                    <span>{deal.source}</span>
                  </div>
                </div>
                <ExternalLink className="size-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MediaSection({
  images,
  videos,
  title,
}: {
  images: string[];
  videos: YouTubeVideo[];
  title: string;
}) {
  if (images.length === 0 && videos.length === 0) {
    return <p className="mt-4 text-muted-foreground text-center">Keine Medien verfügbar</p>;
  }

  return (
    <div className="mt-4 space-y-4">
      {images.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Screenshots</h3>
          <div className="flex gap-2 overflow-x-auto pb-2" role="list" aria-label="Screenshots">
            {images.slice(0, 5).map((img, i) => (
              <figure key={i} className="flex-shrink-0 w-48 aspect-[16/9] rounded overflow-hidden" role="listitem">
                <Image
                  src={img}
                  alt={`${title} Screenshot ${i + 1}`}
                  fill
                  className="object-cover cursor-zoom-in"
                  sizes="192px"
                  unoptimized
                />
              </figure>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Videos</h3>
          <div className="space-y-3">
            {videos.slice(0, 2).map((video) => (
              <div key={video.id} className="aspect-video w-full rounded overflow-hidden bg-muted">
                <iframe
                  src={video.url}
                  title={`${title} Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-full border-0"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCompareEnhanced({
  scores,
  labels,
  average,
  diffs,
}: {
  scores: number[];
  labels: string[];
  average: number | null;
  diffs: number[];
}) {
  if (scores.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${scores.length}, 1fr)` }}>
        {scores.map((score, i) => (
          <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
            <ScoreBlock score={score} className="w-20 h-20 mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground truncate">{labels[i]}</p>
            <p className="text-lg font-semibold tabular-nums">{score}/100</p>
            {average !== null && (
              <p className={`text-xs font-medium ${diffs[i] >= 0 ? "text-green-600" : "text-red-600"}`}>
                {diffs[i] >= 0 ? "+" : ""}{diffs[i]} vs. Ø
              </p>
            )}
          </div>
        ))}
      </div>

      {average !== null && scores.length > 1 && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Durchschnitt aller verglichenen Reviews</span>
            <span className="font-semibold tabular-nums">{average}/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted mt-2">
            <div
              className="h-full rounded-full bg-muted-foreground/30"
              style={{ width: `${average}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { Share2, ExternalLink } from "lucide-react";