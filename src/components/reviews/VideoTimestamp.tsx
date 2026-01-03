"use client";

import { useState } from "react";
import { Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoTimestampProps {
  videoId: string;
  timestamp: number; // in seconds
  label: string;
  className?: string;
}

export function VideoTimestamp({
  videoId,
  timestamp,
  label,
  className,
}: VideoTimestampProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    // Open YouTube video with timestamp
    const url = `https://www.youtube.com/watch?v=${videoId}&t=${timestamp}s`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 h-auto py-2 px-3 rounded-lg hover:bg-primary/10 hover:border-primary/50 transition-all",
        className
      )}
    >
      <Play className="size-4 text-primary" />
      <Clock className="size-3.5 text-muted-foreground" />
      <span className="font-medium">{label}</span>
      <span className="text-xs text-muted-foreground font-mono">
        {formatTime(timestamp)}
      </span>
    </Button>
  );
}

interface VideoTimestampsProps {
  videoId: string;
  timestamps: Array<{ time: number; label: string }>;
  className?: string;
}

export function VideoTimestamps({
  videoId,
  timestamps,
  className,
}: VideoTimestampsProps) {
  if (timestamps.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {timestamps.map((ts, index) => (
        <VideoTimestamp
          key={index}
          videoId={videoId}
          timestamp={ts.time}
          label={ts.label}
        />
      ))}
    </div>
  );
}
