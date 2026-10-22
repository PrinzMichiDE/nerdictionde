"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  targetType: "thread" | "comment" | "review";
  targetId: string;
  initialScore?: number;
  initialUserVote?: -1 | 1 | null;
  className?: string;
}

export function VoteButtons({
  targetType,
  targetId,
  initialScore = 0,
  initialUserVote = null,
  className,
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<-1 | 1 | null>(initialUserVote);
  const [loading, setLoading] = useState(false);

  async function handleVote(value: -1 | 1) {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, value: String(value) }),
      });
      const data = await res.json();
      if (data.success) {
        setScore(data.data.score);
        setUserVote(data.data.userVote);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={cn(
          "p-1 rounded transition-colors hover:bg-muted",
          userVote === 1 ? "text-orange-500" : "text-muted-foreground"
        )}
        aria-label="Upvote"
      >
        <ChevronUp className="size-5" />
      </button>
      <span className="text-sm font-medium tabular-nums min-w-[2ch] text-center">
        {score}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={cn(
          "p-1 rounded transition-colors hover:bg-muted",
          userVote === -1 ? "text-blue-500" : "text-muted-foreground"
        )}
        aria-label="Downvote"
      >
        <ChevronDown className="size-5" />
      </button>
    </div>
  );
}
