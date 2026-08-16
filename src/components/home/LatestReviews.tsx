import Image from "next/image";
import Link from "next/link";
import { Review } from "@/types/review";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { SpotlightCard } from "./SpotlightCard";
import { SectionHeading } from "./SectionHeading";
import { ScrollReveal } from "./ScrollReveal";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const categoryLabels: Record<string, string> = {
  game: "Games",
  movie: "Filme",
  series: "Serien",
};

interface LatestReviewsProps {
  reviews: Review[];
}

function ReviewCardItem({ review }: { review: Review }) {
  const imageUrl = review.images?.[0];
  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <SpotlightCard className="h-full rounded-2xl">
      <Link
        href={`/reviews/${review.slug}`}
        className="group flex h-full flex-col rounded-2xl border border-border bg-card transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Bild */}
        <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={review.title}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-muted-foreground text-xs font-medium">Kein Bild</span>
            </div>
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-30"
            aria-hidden="true"
          />
          <div className="absolute top-3 right-3">
            <ScoreBadge score={review.score} className="h-11 w-11 text-base shadow-lg" />
          </div>
          <span
            className="absolute bottom-3 left-3 inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-white backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            {categoryLabels[review.category] || review.category}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2.5 p-5">
          <time className="text-xs text-muted-foreground" dateTime={review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt}>
            {formattedDate}
          </time>
          <h3 className="font-serif text-xl font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary">
            {review.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {review.content?.replace(/[#*`]/g, "").substring(0, 150)}...
          </p>
          <div className="mt-auto pt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <span>Zum Test</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </SpotlightCard>
  );
}

export function LatestReviews({ reviews }: LatestReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <section className="space-y-10 md:space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          align="left"
          kicker="Aktuelle Tests"
          title="Neueste Reviews"
          description="Die frischesten Tests aus der Redaktion – regelmäßig aktualisiert."
          className="max-w-2xl"
        />
        <ScrollReveal variant="fade" delay={150}>
          <Link
            href="/reviews"
            className="group hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:border-primary/40 hover:text-primary hover:shadow-lg hover:shadow-primary/10"
          >
            Alle ansehen
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </ScrollReveal>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, i) => (
          <ScrollReveal key={review.id} variant="up" delay={(i % 3) * 120} className="h-full">
            <ReviewCardItem review={review} />
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal variant="fade" delay={100} className="flex justify-center sm:hidden">
        <Link
          href="/reviews"
          className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:text-primary"
        >
          Alle Reviews ansehen
          <ArrowRight className="size-4" />
        </Link>
      </ScrollReveal>
    </section>
  );
}
