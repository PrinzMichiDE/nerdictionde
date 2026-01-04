"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Youtube, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Review } from "@/types/review";
import Link from "next/link";
import Image from "next/image";

interface VideoGalleryProps {
  reviews: Review[];
}

function extractVideoId(urlOrId: string): string | null {
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function VideoGallery({ reviews }: VideoGalleryProps) {
  const [isVisible, setIsVisible] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Collect all videos from reviews
  const allVideos = reviews
    .flatMap((review) =>
      review.youtubeVideos?.map((video, idx) => {
        const videoId = extractVideoId(video);
        return videoId
          ? {
              id: videoId,
              url: video,
              title: review.title,
              reviewSlug: review.slug,
              thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              reviewId: `${review.id}-${idx}`,
            }
          : null;
      }) || []
    )
    .filter((video): video is NonNullable<typeof video> => video !== null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (galleryRef.current) {
      observer.observe(galleryRef.current);
    }

    return () => {
      if (galleryRef.current) {
        observer.unobserve(galleryRef.current);
      }
    };
  }, []);

  if (allVideos.length === 0) {
    return null;
  }

  return (
    <section ref={galleryRef} className="space-y-8 py-16">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-2">
          <Youtube className="h-4 w-4 text-red-500" />
          <span className="text-sm font-semibold text-red-500 uppercase tracking-wide">
            Video-Galerie
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Unsere Video-Reviews
        </h2>
        <p className="text-muted-foreground text-lg">
          Detaillierte Video-Analysen unserer Tests
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allVideos.slice(0, 9).map((video, index) => (
          <Card
            key={video.reviewId}
            className={`group relative overflow-hidden border-2 transition-all duration-700 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 hover:border-red-500/30 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: `${index * 0.1}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
            
            {/* Video Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-muted">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                unoptimized
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="p-4 rounded-full bg-red-500/90 backdrop-blur-sm border-4 border-background shadow-2xl group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
                  <Play className="h-8 w-8 text-white fill-white ml-1" />
                </div>
              </div>

              {/* YouTube Badge */}
              <div className="absolute top-4 right-4 z-20">
                <div className="p-2 rounded-lg bg-background/90 backdrop-blur-sm border-2 border-red-500/30">
                  <Youtube className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg line-clamp-2 group-hover:text-red-500 transition-colors">
                {video.title}
              </h3>
              
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 border-2 hover:border-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Link href={`/reviews/${video.reviewSlug}`} className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Zum Review
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="border-2 hover:border-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {allVideos.length > 9 && (
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            +{allVideos.length - 9} weitere Videos verfügbar
          </p>
        </div>
      )}
    </section>
  );
}
