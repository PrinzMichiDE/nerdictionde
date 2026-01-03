"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
}

/**
 * Extracts YouTube video ID from various URL formats or returns the ID if already extracted
 */
function extractVideoId(urlOrId: string): string | null {
  // If it's already just an ID (11 characters, alphanumeric, dashes, underscores)
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }

  // Try to extract from various YouTube URL formats
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

export function YouTubeEmbed({ videoId, title, className = "" }: YouTubeEmbedProps) {
  const [isClient, setIsClient] = useState(false);
  const [embedId, setEmbedId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    const extractedId = extractVideoId(videoId);
    setEmbedId(extractedId);
  }, [videoId]);

  if (!isClient || !embedId) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-2xl border-2 bg-muted/50 flex items-center justify-center ${className}`}>
        <div className="text-center space-y-2">
          <Play className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-2xl border-2 shadow-xl group ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/${embedId}?rel=0&modestbranding=1`}
        title={title || "YouTube video player"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        loading="lazy"
      />
    </div>
  );
}

