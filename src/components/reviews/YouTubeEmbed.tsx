"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { VideoChapters } from "./VideoChapters";

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  reviewId?: string;
  isEn?: boolean;
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

export function YouTubeEmbed({
  videoId,
  title,
  className = "",
  reviewId,
  isEn = false,
}: YouTubeEmbedProps) {
  const [isClient, setIsClient] = useState(false);
  const [embedId, setEmbedId] = useState<string | null>(null);
  const [startAt, setStartAt] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const extractedId = extractVideoId(videoId);
    setEmbedId(extractedId);
  }, [videoId]);

  if (!isClient || !embedId) {
    return (
      <div
        className={`relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted flex items-center justify-center ${className}`}
      >
        <div className="text-center space-y-2">
          <Play className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {isEn ? "Loading video…" : "Video wird geladen…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${embedId}?rel=0&modestbranding=1${startAt > 0 ? `&start=${startAt}` : ""}`}
          title={title || "YouTube video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      </div>
      {reviewId && (
        <VideoChapters
          reviewId={reviewId}
          videoId={embedId}
          onSeek={setStartAt}
          isEn={isEn}
        />
      )}
    </div>
  );
}
