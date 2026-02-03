"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface VideoChapterData {
  id: string;
  videoId: string;
  title: string;
  timestamp: number;
  description?: string | null;
}

interface VideoChaptersProps {
  reviewId: string;
  videoId?: string;
  onSeek?: (seconds: number) => void;
  className?: string;
}

/**
 * Displays video chapters for a review. Fetches from API if available.
 */
export function VideoChapters({
  reviewId,
  videoId,
  onSeek,
  className,
}: VideoChaptersProps) {
  const [chapters, setChapters] = useState<VideoChapterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reviews/${reviewId}/video-chapters`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => (Array.isArray(data) ? data : []))
      .then((list) => (videoId ? list.filter((c: VideoChapterData) => c.videoId === videoId) : list))
      .then(setChapters)
      .catch(() => setChapters([]))
      .finally(() => setLoading(false));
  }, [reviewId, videoId]);

  if (loading || chapters.length === 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <nav aria-label="Video-Kapitel" className={cn("space-y-2", className)}>
      <h3 className="font-semibold text-sm text-muted-foreground">Kapitel</h3>
      <ul className="space-y-1">
        {chapters.map((ch) => (
          <li key={ch.id}>
            <button
              type="button"
              onClick={() => onSeek?.(ch.timestamp)}
              className="flex items-center gap-2 w-full text-left text-sm rounded-lg px-3 py-2 hover:bg-muted transition-colors"
            >
              <span className="tabular-nums text-muted-foreground shrink-0">
                {formatTime(ch.timestamp)}
              </span>
              <span className="truncate">{ch.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
