"use client";

import { useState, useEffect } from "react";
import { Gamepad2 } from "lucide-react";

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
  isEn?: boolean;
}

export function GameProgressTracker({ reviewId, isEn = false }: GameProgressTrackerProps) {
  const [progress, setProgress] = useState<GameProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reviews/${reviewId}/game-progress`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setProgress(Array.isArray(data) ? data[0] : data);
      })
      .catch(() => {
        if (!cancelled) setProgress(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reviewId]);

  if (loading || !progress) return null;

  const hasData =
    progress.playtimeHours != null ||
    progress.completion != null ||
    progress.achievements != null ||
    (progress.notes && progress.notes.trim().length > 0);

  if (!hasData) return null;

  const statItems = [
    {
      label: isEn ? "Playtime" : "Spielzeit",
      value:
        progress.playtimeHours != null
          ? `${progress.playtimeHours.toFixed(1)} h`
          : null,
    },
    {
      label: isEn ? "Progress" : "Fortschritt",
      value: progress.completion != null ? `${progress.completion} %` : null,
    },
    {
      label: isEn ? "Achievements" : "Erfolge",
      value: progress.achievements != null ? String(progress.achievements) : null,
    },
  ].filter((item) => item.value != null);

  return (
    <section
      className="space-y-6 pt-10 border-t border-border"
      aria-label={isEn ? "Tested playthrough" : "Test-Durchlauf"}
    >
      <div className="border-b border-border pb-4">
        <span className="kicker text-primary inline-flex items-center gap-1.5">
          <Gamepad2 className="h-3.5 w-3.5" />
          {isEn ? "Test Notes" : "Test-Durchlauf"}
        </span>
        <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          {isEn ? "Our Playthrough" : "Unser Durchlauf"}
        </h2>
      </div>

      {statItems.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-md overflow-hidden">
          {statItems.map((item) => (
            <div key={item.label} className="bg-card px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {progress.notes && progress.notes.trim().length > 0 && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          {progress.notes.replace(/[#*`]/g, "").slice(0, 400)}
          {progress.notes.replace(/[#*`]/g, "").length > 400 ? "…" : ""}
        </p>
      )}
    </section>
  );
}
