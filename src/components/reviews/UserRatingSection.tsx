"use client";

import { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRatingSectionProps {
  reviewId: string;
  userRatingAvg: number;
  userRatingCount: number;
  isLoggedIn: boolean;
  initialUserRating?: { score: number; text?: string | null } | null;
}

export function UserRatingSection({
  reviewId,
  userRatingAvg,
  userRatingCount,
  isLoggedIn,
  initialUserRating,
}: UserRatingSectionProps) {
  const [score, setScore] = useState(initialUserRating?.score ?? 0);
  const [hoverScore, setHoverScore] = useState(0);
  const [text, setText] = useState(initialUserRating?.text ?? "");
  const [submitted, setSubmitted] = useState(!!initialUserRating);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (loading || score === 0) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, score, text: text || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const displayScore = hoverScore || score;

  return (
    <div className="p-6 rounded-md border border-border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold tracking-tight">
          Community-Wertung
        </h3>
        {userRatingCount > 0 && (
          <span className="text-sm text-muted-foreground">
            Ø {userRatingAvg.toFixed(1)} aus {userRatingCount} {userRatingCount === 1 ? "Bewertung" : "Bewertungen"}
          </span>
        )}
      </div>

      {!isLoggedIn ? (
        <p className="text-sm text-muted-foreground">
          <a href="/api/auth/twitch/login" className="text-primary hover:underline">
            Melde dich an
          </a>
          , um diese Review zu bewerten.
        </p>
      ) : submitted ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
          <Star className="size-4 fill-current" />
          Danke für deine Bewertung!
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHoverScore(n)}
                onMouseLeave={() => setHoverScore(0)}
                onClick={() => setScore(n)}
                className={cn(
                  "p-0.5 transition-colors",
                  n <= displayScore
                    ? "text-yellow-500"
                    : "text-muted-foreground/40"
                )}
                aria-label={`${n} von 10`}
              >
                <Star
                  className={cn(
                    "size-5",
                    n <= displayScore && "fill-current"
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium tabular-nums">
              {displayScore > 0 ? `${displayScore}/10` : "Bewerten"}
            </span>
          </div>

          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Deine Meinung (optional)..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              maxLength={1000}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || score === 0}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Wird gespeichert..." : "Bewertung abgeben"}
          </button>
        </div>
      )}
    </div>
  );
}
