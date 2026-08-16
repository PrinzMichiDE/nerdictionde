import Link from "next/link";
import { Review } from "@/types/review";
import { ScoreBadge } from "./ScoreBadge";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

interface ReviewCardProps {
  review: Review;
}

const categoryLabels: Record<string, string> = {
  game: "Games",
  movie: "Filme",
  series: "Serien",
};

export function ReviewCard({ review }: ReviewCardProps) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categoryLabel = categoryLabels[review.category] || review.category;

  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
    >
      <article className="flex h-full flex-col">
        <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-muted">
          {review.images?.[0] ? (
            <Image
              src={review.images[0]}
              alt={review.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground text-xs font-medium">Kein Bild</span>
            </div>
          )}
          <div className="absolute top-2.5 right-2.5">
            <ScoreBadge score={review.score} className="h-10 w-10 text-sm" />
          </div>
        </div>

        <div className="pt-4 flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="kicker text-primary">{categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt}>
              {formattedDate}
            </time>
          </div>

          <h3 className="font-serif text-xl font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary">
            {review.title}
          </h3>

          <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
            {review.content.replace(/[#*`]/g, "").substring(0, 150)}...
          </p>

          <div className="mt-auto pt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Weiterlesen
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </article>
    </Link>
  );
}
