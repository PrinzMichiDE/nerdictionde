import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ScoreBlock } from "@/components/shared/ScoreBlock";
import { ProsCons } from "@/components/shared/ProsCons";
import { SpecTable } from "@/components/shared/SpecTable";
import { ScoreCompare } from "@/components/shared/ScoreCompare";
import { getCategoryStyle, getVerdict } from "@/lib/review-category";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Reviews vergleichen",
  description:
    "Zwei Nerdiction-Tests direkt gegenüberstellen: Wertung, Pros & Cons, Kategorie und Release-Datum im Seitenvergleich.",
  alternates: {
    canonical: "/reviews/vergleichen",
  },
};

interface ReviewShape {
  id: string;
  title: string;
  slug: string;
  category: string;
  score: number;
  pros: string[];
  cons: string[];
  images: string[];
  releaseDate: Date | null;
}

async function fetchReviewBySlug(slug: string): Promise<ReviewShape | null> {
  return prisma.review.findUnique({
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
    },
  });
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a: slugA, b: slugB } = await searchParams;

  const reviews: ReviewShape[] = [];
  if (slugA) {
    const r = await fetchReviewBySlug(slugA);
    if (r) reviews.push(r);
  }
  if (slugB && slugB !== slugA) {
    const r = await fetchReviewBySlug(slugB);
    if (r) reviews.push(r);
  }

  if (reviews.length === 0) notFound();

  const isSingle = reviews.length === 1;

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-8 px-4">
      <Link
        href="/reviews"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        <ArrowLeft className="size-4" />
        Zurück zu allen Reviews
      </Link>

      <div className="space-y-3">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
          Reviews vergleichen
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Zwei Tests direkt gegenüberstellen: Wertung, Pros &amp; Cons,
          Kategorie und Release-Datum im Seitenvergleich.
        </p>
      </div>

      {isSingle && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Nur ein Test im Vergleich. Füge über "Zum Vergleich hinzufügen" auf
            einer Review-Seite einen zweiten Test hinzu.
          </p>
        </div>
      )}

      {reviews.length === 2 && (
        <section className="grid gap-8 md:grid-cols-2">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-lg border border-border bg-card overflow-hidden flex flex-col"
            >
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
                      ? format(new Date(review.releaseDate), "dd.MM.yyyy", {
                          locale: de,
                        })
                      : "–"}
                  </span>
                  <span className="text-right font-semibold tabular-nums">
                    {review.score}/100
                  </span>
                </div>

                <div className="mt-auto pt-4 border-t border-border space-y-3">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Vorteile
                    </h3>
                    <ProsCons pros={review.pros} cons={[]} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Nachteile
                    </h3>
                    <ProsCons pros={[]} cons={review.cons} />
                  </div>
                </div>
              </div>
            </article>
          ))}

          <div className="col-span-full rounded-lg border border-border bg-card p-6">
            <h2 className="font-serif text-2xl font-semibold tracking-tight mb-4">
              Wertungsunterschied
            </h2>
            <ScoreCompare
              reviewScore={reviews[0].score}
              categoryAverage={reviews[1].score}
              categoryLabel={getCategoryStyle(reviews[0].category).label}
            />
          </div>
        </section>
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
