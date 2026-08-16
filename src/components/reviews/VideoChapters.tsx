"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ListVideo } from "lucide-react";

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
  isEn?: boolean;
}

export function VideoChapters({
  reviewId,
  videoId,
  onSeek,
  className,
  isEn = false,
}: VideoChaptersProps) {
  const [chapters, setChapters] = useState<VideoChapterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reviews/${reviewId}/video-chapters`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        const list: VideoChapterData[] = Array.isArray(data) ? data : [];
        setChapters(
          videoId ? list.filter((c) => c.videoId === videoId) : list
        );
      })
      .catch(() => {
        if (!cancelled) setChapters([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reviewId, videoId]);

  if (loading || chapters.length === 0) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <nav
      aria-label={isEn ? "Video chapters" : "Video-Kapitel"}
      className={cn("space-y-2", className)}
    >
      <h3 className="kicker text-muted-foreground flex items-center gap-1.5">
        <ListVideo className="size-3.5" aria-hidden="true" />
        {isEn ? "Chapters" : "Kapitel"}
      </h3>
      <ul className="divide-y divide-border border border-border rounded-md overflow-hidden">
        {chapters.map((ch) => (
          <li key={ch.id}>
            <button
              type="button"
              onClick={() => onSeek?.(ch.timestamp)}
              className="flex items-center gap-3 w-full text-left text-sm px-3 py-2.5 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[3px]"
            >
              <span className="tabular-nums text-muted-foreground shrink-0">
                {formatTime(ch.timestamp)}
              </span>
              <span className="truncate font-medium">{ch.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
