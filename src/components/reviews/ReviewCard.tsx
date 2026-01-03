import Link from "next/link";
import { Review } from "@/types/review";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "./ScoreBadge";
import Image from "next/image";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 border-2 hover:border-primary/20 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {review.images?.[0] ? (
          <Image
            src={review.images[0]}
            alt={`${review.title} - Hero Bild`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50" aria-hidden="true">
            <span className="text-muted-foreground text-xs font-medium">Kein Bild</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
        <ScoreBadge
          score={review.score}
          className="absolute bottom-3 right-3 scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg"
          aria-label={`Bewertung: ${review.score} von 100`}
        />
      </div>
      <CardHeader className="p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge 
            variant="outline" 
            className="capitalize text-xs font-semibold border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
            aria-label={`Kategorie: ${review.category}`}
          >
            {review.category}
          </Badge>
          <time 
            dateTime={review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt}
            className="text-xs text-muted-foreground font-medium"
          >
            {formattedDate}
          </time>
        </div>
        <CardTitle className="line-clamp-2 text-lg leading-tight group-hover:text-primary transition-colors">
          <Link href={`/reviews/${review.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            {review.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
          {review.content.replace(/[#*`]/g, "").substring(0, 150)}...
        </p>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Link
          href={`/reviews/${review.slug}`}
          className="group/link flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-label={`Weiterlesen: ${review.title}`}
        >
          Weiterlesen
          <span className="transition-transform group-hover/link:translate-x-1" aria-hidden="true">→</span>
        </Link>
      </CardFooter>
    </Card>
  );
}

