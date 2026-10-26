"use client";

import React from "react";

interface YouTubeVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
}

interface ReviewCompareVideosProps {
  videos: YouTubeVideo[];
  title: string;
}

export function ReviewCompareVideos({ videos, title }: ReviewCompareVideosProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Keine Videos verfügbar
      </div>
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label={`${title} Videos`}>
      {videos.slice(0, 2).map((video, i) => (
        <div key={video.id} className="aspect-video w-full rounded overflow-hidden bg-muted" role="listitem">
          <iframe
            src={video.url}
            title={`${title} Video ${i + 1}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="w-full h-full border-0"
          />
        </div>
      ))}
    </div>
  );
}