"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export interface DealData {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  discount?: number | null;
  currency: string;
  url: string;
  imageUrl?: string | null;
  source: string;
  category?: string | null;
  reviewId?: string | null;
  review?: { slug: string; title: string; category: string } | null;
}

interface DealCardProps {
  deal: DealData;
}

export function DealCard({ deal }: DealCardProps) {
  const reviewSlug = deal.review?.slug;

  return (
    <article className="rounded-xl border-2 bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
      <a
        href={deal.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative aspect-video w-full bg-muted">
          {deal.imageUrl ? (
            <Image
              src={deal.imageUrl}
              alt={deal.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
              Deal
            </div>
          )}
          {deal.discount != null && deal.discount > 0 && (
            <Badge className="absolute right-2 top-2 bg-destructive text-destructive-foreground">
              -{Math.round(deal.discount)}%
            </Badge>
          )}
        </div>
      </a>
      <div className="p-4 space-y-2">
        <a
          href={deal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold leading-tight line-clamp-2 hover:text-primary"
        >
          {deal.title}
        </a>
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-primary">
            {deal.price.toFixed(2)} {deal.currency}
          </span>
          {deal.originalPrice != null && deal.originalPrice > deal.price && (
            <span className="text-sm text-muted-foreground line-through">
              {deal.originalPrice.toFixed(2)} {deal.currency}
            </span>
          )}
        </div>
        {reviewSlug && (
          <Link
            href={`/reviews/${reviewSlug}`}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            → Zum Review
          </Link>
        )}
      </div>
    </article>
  );
}
