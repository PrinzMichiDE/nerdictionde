"use client";

import { Review } from "@/types/review";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { ArrowRight, Play } from "lucide-react";
import { useMemo } from "react";

interface ReviewHeroProps {
  review: Review;
}

/**
 * Extracts headings from markdown content for table of contents
 */
function extractHeadings(markdown: string): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];
  let match;
  let firstH1Found = false;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    let text = match[2].trim();
    
    // Remove markdown links from heading text
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Skip the first H1 (main title) - it's already displayed at the top
    if (level === 1 && !firstH1Found) {
      firstH1Found = true;
      continue;
    }
    
    // Skip the table of contents heading itself
    const tocHeadingText = "Inhaltsverzeichnis";
    if (text.toLowerCase() === tocHeadingText.toLowerCase() || 
        text.toLowerCase() === "table of contents") {
      continue;
    }
    
    // Generate ID similar to rehype-slug (handles German umlauts and special chars)
    const id = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .trim();
    
    headings.push({ level, text, id });
  }

  return headings;
}

export function ReviewHero({ review }: ReviewHeroProps) {
  const imageUrl = review.images?.[0];
  
  // Extract headings for table of contents
  const headings = useMemo(() => {
    if (!review.content) return [];
    return extractHeadings(review.content);
  }, [review.content]);
  
  // Limit to first 4-5 headings for hero display
  const displayHeadings = headings.slice(0, 5);

  return (
    <section className="relative w-full h-[70vh] min-h-[600px] md:h-[85vh] md:min-h-[700px] lg:h-[90vh] lg:min-h-[800px] xl:min-h-[900px] max-h-[1000px] overflow-hidden rounded-3xl mb-16 md:mb-24 group">
      {/* Background Image */}
      {imageUrl ? (
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={review.title}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            priority
            unoptimized
            sizes="100vw"
          />
          {/* Gradient Overlay - Enhanced for Desktop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/50 md:from-black/90 md:via-black/60 md:to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent md:from-black/50 md:via-black/20 md:to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 lg:p-16 xl:p-20">
        <div className="max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          {/* Category Badge */}
          <Badge
            variant="outline"
            className="mb-4 md:mb-6 bg-background/80 backdrop-blur-sm border-2 capitalize text-sm md:text-base font-semibold px-4 py-2 md:px-5 md:py-2.5"
          >
            {review.category}
          </Badge>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-white mb-4 md:mb-6 leading-tight drop-shadow-2xl">
            {review.title}
          </h1>

          {/* Score & Meta */}
          <div className="flex items-center gap-6 md:gap-8 mb-6 md:mb-8 flex-wrap">
            <ScoreBadge
              score={review.score}
              className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 text-2xl md:text-3xl lg:text-4xl border-4 border-white shadow-2xl"
            />
            <div className="text-white/90">
              <p className="text-lg md:text-xl lg:text-2xl font-semibold">
                {review.score >= 90
                  ? "Phänomenal"
                  : review.score >= 80
                  ? "Hervorragend"
                  : review.score >= 70
                  ? "Gut"
                  : "Befriedigend"}
              </p>
              <p className="text-sm md:text-base text-white/70">
                {new Date(review.createdAt).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Table of Contents */}
          {displayHeadings.length > 0 && (
            <div className="mb-6 md:mb-8 max-w-3xl xl:max-w-4xl">
              <h3 className="text-white/90 text-base md:text-lg font-semibold mb-2 md:mb-3 drop-shadow-lg">
                Inhaltsverzeichnis
              </h3>
              <div className="text-white/80 text-sm md:text-base leading-relaxed drop-shadow-md space-y-1">
                {displayHeadings.map((heading, index) => (
                  <div key={heading.id} className="flex items-start gap-2">
                    <span className="text-white/70 font-medium flex-shrink-0">{index + 1}.</span>
                    <Link
                      href={`/reviews/${review.slug}#${heading.id}`}
                      className="hover:text-white transition-colors underline-offset-2 hover:underline break-words"
                    >
                      {heading.text}
                    </Link>
                  </div>
                ))}
                {headings.length > displayHeadings.length && (
                  <div className="text-white/50 text-sm italic">
                    ...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Excerpt */}
          <p className="text-white/90 text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 leading-relaxed line-clamp-3 md:line-clamp-4 max-w-3xl xl:max-w-4xl drop-shadow-lg">
            {review.content?.replace(/[#*`]/g, "").substring(0, 250)}...
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4 md:gap-6">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-white text-black hover:bg-white/90 shadow-2xl text-base md:text-lg lg:text-xl px-6 md:px-8 lg:px-10 py-5 md:py-6 lg:py-7 h-auto group"
            >
              <Link href={`/reviews/${review.slug}`} className="flex items-center gap-2 md:gap-3">
                Vollständigen Review lesen
                <ArrowRight className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {review.youtubeVideos?.[0] && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-base md:text-lg lg:text-xl px-6 md:px-8 lg:px-10 py-5 md:py-6 lg:py-7 h-auto"
              >
                <a
                  href={`https://www.youtube.com/watch?v=${review.youtubeVideos[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 md:gap-3"
                >
                  <Play className="h-5 w-5 md:h-6 md:w-6" />
                  Video ansehen
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
