import Link from "next/link";
import { Review } from "@/types/review";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight } from "lucide-react";
import Image from "next/image";

interface FeaturedReviewProps {
  review: Review;
}

export function FeaturedReview({ review }: FeaturedReviewProps) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 mb-2">
          <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-500 fill-current" />
          <span className="text-sm font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-400">
            Featured Review
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Review der Woche</h2>
        <p className="text-muted-foreground">
          Unser Highlight - das beste Review der letzten Zeit
        </p>
      </div>

      <Card className="group relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative aspect-video md:aspect-auto md:h-full min-h-[300px] overflow-hidden bg-muted">
            {review.images?.[0] ? (
              <Image
                src={review.images[0]}
                alt={review.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <span className="text-muted-foreground text-sm font-medium">Kein Bild</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent md:bg-gradient-to-r md:from-background/90 md:via-background/50 md:to-transparent" />
            
            {/* Score Badge */}
            <div className="absolute top-6 left-6 z-10">
              <ScoreBadge
                score={review.score}
                className="h-20 w-20 text-3xl border-4 border-background shadow-2xl"
              />
            </div>

            {/* Category Badge */}
            <div className="absolute top-6 right-6 z-10">
              <Badge 
                variant="outline" 
                className="capitalize text-sm font-semibold border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-colors px-4 py-2"
              >
                {review.category}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <CardContent className="p-8 md:p-12 flex flex-col justify-center space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <time dateTime={review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt} className="font-medium">
                  {formattedDate}
                </time>
                <span>•</span>
                <span className="font-semibold text-primary">
                  {review.score >= 90 ? "Phänomenal" : review.score >= 80 ? "Hervorragend" : review.score >= 70 ? "Gut" : "Befriedigend"}
                </span>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight group-hover:text-primary transition-colors">
                {review.title}
              </h3>
              
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed line-clamp-4">
                {review.content.replace(/[#*`]/g, "").substring(0, 300)}...
              </p>

              {/* Pros Preview */}
              {review.pros && review.pros.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-semibold text-foreground">Highlights:</p>
                  <ul className="flex flex-wrap gap-2">
                    {review.pros.slice(0, 3).map((pro, index) => (
                      <li key={index}>
                        <Badge variant="secondary" className="text-xs font-normal">
                          ✓ {pro}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button 
                asChild 
                size="lg" 
                className="group/button rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Link href={`/reviews/${review.slug}`} className="flex items-center gap-2">
                  Vollständigen Review lesen
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </section>
  );
}

