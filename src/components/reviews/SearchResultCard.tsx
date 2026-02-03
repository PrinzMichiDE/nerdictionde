"use client";

import Link from "next/link";
import Image from "next/image";
import { Review } from "@/types/review";
import { ScoreBadge } from "./ScoreBadge";
import { Badge } from "@/components/ui/badge";

interface SearchResultCardProps {
  review: Review;
  /** Optional search term to highlight in title/snippet */
  highlight?: string;
}

function highlightText(text: string, term: string): React.ReactNode {
  if (!term || term.length < 2) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 rounded px-0.5">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}

export function SearchResultCard({ review, highlight }: SearchResultCardProps) {
  const snippet = (review.content ?? "").replace(/[#*`]/g, "").slice(0, 160);
  const title = review.title;

  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="group block rounded-xl border-2 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex gap-4">
        <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
          {review.images?.[0] ? (
            <Image
              src={review.images[0]}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="160px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
              Kein Bild
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight line-clamp-2">
              {highlight ? highlightText(title, highlight) : title}
            </h3>
            <ScoreBadge score={review.score} className="h-8 w-8 text-sm shrink-0" />
          </div>
          <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
            {review.category}
          </Badge>
          {snippet && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {highlight && highlight.length >= 2 ? highlightText(snippet, highlight) : `${snippet}…`}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
