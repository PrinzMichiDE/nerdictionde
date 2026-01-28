"use client";

import { Review } from "@/types/review";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { ArrowRight, Play, Calendar, Star } from "lucide-react";
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

/**
 * Gets the rating label based on score
 */
function getRatingLabel(score: number): string {
  if (score >= 90) return "Phänomenal";
  if (score >= 80) return "Hervorragend";
  if (score >= 70) return "Gut";
  if (score >= 60) return "Befriedigend";
  return "Ausreichend";
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
  
  // Format date
  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative w-full h-[75vh] min-h-[650px] md:h-[88vh] md:min-h-[750px] lg:h-[92vh] lg:min-h-[850px] xl:min-h-[950px] max-h-[1100px] overflow-hidden rounded-3xl mb-16 md:mb-24 group isolate">
      {/* Background Image with Parallax Effect */}
      {imageUrl ? (
        <div className="absolute inset-0 -z-10">
          <Image
            src={imageUrl}
            alt={review.title}
            fill
            className="object-cover transition-transform duration-[3000ms] ease-out group-hover:scale-110"
            priority
            unoptimized
            sizes="100vw"
            quality={90}
          />
          {/* Multi-layer Gradient Overlay for better readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          {/* Subtle vignette effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]" />
        </div>
      ) : (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/30 via-primary/15 to-background" />
      )}

      {/* Animated grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col justify-end">
        <div className="px-6 md:px-12 lg:px-16 xl:px-20 pb-8 md:pb-12 lg:pb-16 xl:pb-20">
          <div className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
            {/* Category Badge with Animation */}
            <div className="animate-slide-up [animation-delay:0.1s] [animation-fill-mode:both] mb-5 md:mb-6">
              <Badge
                variant="outline"
                className="bg-background/90 backdrop-blur-md border-2 border-white/20 capitalize text-sm md:text-base font-semibold px-5 py-2.5 md:px-6 md:py-3 shadow-xl hover:bg-background/95 transition-all duration-300"
              >
                <Star className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 text-primary" />
                {review.category}
              </Badge>
            </div>

            {/* Title with Animation */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-white mb-6 md:mb-8 leading-[1.1] tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-slide-up [animation-delay:0.2s] [animation-fill-mode:both]">
              {review.title}
            </h1>

            {/* Score & Meta Section with improved layout */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 mb-6 md:mb-8 animate-slide-up [animation-delay:0.3s] [animation-fill-mode:both]">
              {/* Score Badge */}
              <div className="flex items-center gap-4">
                <ScoreBadge
                  score={review.score}
                  className="h-20 w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 text-3xl md:text-4xl lg:text-5xl border-4 border-white/90 shadow-2xl ring-4 ring-white/20"
                />
                <div className="text-white space-y-1">
                  <p className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                    {getRatingLabel(review.score)}
                  </p>
                  <p className="text-sm md:text-base text-white/80 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    {formattedDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Table of Contents - Enhanced Design */}
            {displayHeadings.length > 0 && (
              <div className="mb-6 md:mb-8 max-w-4xl animate-slide-up [animation-delay:0.4s] [animation-fill-mode:both]">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-6 shadow-xl">
                  <h3 className="text-white text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
                    <span className="text-xl">📑</span>
                    Inhaltsverzeichnis
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                    {displayHeadings.map((heading, index) => (
                      <Link
                        key={heading.id}
                        href={`/reviews/${review.slug}#${heading.id}`}
                        className="group/toc flex items-start gap-2 text-white/85 hover:text-white transition-all duration-200 hover:translate-x-1"
                      >
                        <span className="text-white/60 font-semibold flex-shrink-0 text-sm md:text-base">
                          {index + 1}.
                        </span>
                        <span className="text-sm md:text-base leading-relaxed underline-offset-2 group-hover/toc:underline">
                          {heading.text}
                        </span>
                      </Link>
                    ))}
                  </div>
                  {headings.length > displayHeadings.length && (
                    <p className="text-white/50 text-xs md:text-sm italic mt-3">
                      + {headings.length - displayHeadings.length} weitere Abschnitte
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Excerpt - Enhanced Typography */}
            <p className="text-white/95 text-base md:text-lg lg:text-xl xl:text-2xl mb-8 md:mb-10 leading-relaxed line-clamp-3 md:line-clamp-4 max-w-4xl drop-shadow-lg animate-slide-up [animation-delay:0.5s] [animation-fill-mode:both] font-medium">
              {review.content?.replace(/[#*`]/g, "").substring(0, 280)}...
            </p>

            {/* CTA Buttons - Enhanced Design */}
            <div className="flex flex-wrap gap-4 md:gap-6 animate-slide-up [animation-delay:0.6s] [animation-fill-mode:both]">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-black hover:bg-white/95 shadow-2xl hover:shadow-white/50 text-base md:text-lg lg:text-xl px-8 md:px-10 lg:px-12 py-6 md:py-7 lg:py-8 h-auto font-semibold group/btn transition-all duration-300 hover:scale-105"
              >
                <Link href={`/reviews/${review.slug}`} className="flex items-center gap-2 md:gap-3">
                  Vollständigen Review lesen
                  <ArrowRight className="h-5 w-5 md:h-6 md:w-6 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </Button>
              {review.youtubeVideos?.[0] && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-2 border-white/40 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:border-white/60 text-base md:text-lg lg:text-xl px-8 md:px-10 lg:px-12 py-6 md:py-7 lg:py-8 h-auto font-semibold transition-all duration-300 hover:scale-105 shadow-xl"
                >
                  <a
                    href={`https://www.youtube.com/watch?v=${review.youtubeVideos[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 md:gap-3"
                  >
                    <Play className="h-5 w-5 md:h-6 md:w-6 fill-white" />
                    Video ansehen
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
    </section>
  );
}
