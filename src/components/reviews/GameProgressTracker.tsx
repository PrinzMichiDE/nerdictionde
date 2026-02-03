"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface GameProgressData {
  id: string;
  playtimeHours?: number | null;
  completion?: number | null;
  achievements?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GameProgressTrackerProps {
  reviewId: string;
}

/**
 * Displays game progress data if available (from API in future).
 * For now shows a placeholder; can be extended with GET /api/reviews/[id]/game-progress.
 */
export function GameProgressTracker({ reviewId }: GameProgressTrackerProps) {
  const [progress, setProgress] = useState<GameProgressData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews/${reviewId}/game-progress`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (Array.isArray(data) ? data[0] : data))
      .then(setProgress)
      .catch(() => setProgress(null))
      .finally(() => setLoading(false));
  }, [reviewId]);

  if (loading || !progress) {
    return null;
  }

  const hasData =
    progress.playtimeHours != null ||
    progress.completion != null ||
    progress.achievements != null ||
    (progress.notes && progress.notes.trim().length > 0);

  if (!hasData) return null;

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">Spielstand</h3>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          {progress.playtimeHours != null && (
            <div>
              <p className="text-muted-foreground">Spielzeit</p>
              <p className="font-medium">{progress.playtimeHours.toFixed(1)} h</p>
            </div>
          )}
          {progress.completion != null && (
            <div>
              <p className="text-muted-foreground">Fortschritt</p>
              <p className="font-medium">{progress.completion} %</p>
            </div>
          )}
          {progress.achievements != null && (
            <div>
              <p className="text-muted-foreground">Achievements</p>
              <p className="font-medium">{progress.achievements}</p>
            </div>
          )}
        </div>
        {progress.notes && progress.notes.trim().length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground border-t pt-4">
            {progress.notes.replace(/[#*`]/g, "").slice(0, 200)}
            {progress.notes.length > 200 ? "…" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
