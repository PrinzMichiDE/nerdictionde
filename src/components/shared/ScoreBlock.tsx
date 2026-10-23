"use client";

import { getVerdict } from "@/lib/review-category";

interface ScoreBlockProps {
  score: number;
  className?: string;
}

function scoreBandColor(score: number): string {
  if (score >= 90) return "var(--chart-3)";
  if (score >= 75) return "var(--chart-2)";
  if (score >= 50) return "var(--chart-4)";
  if (score >= 25) return "var(--chart-1)";
  return "var(--destructive)";
}

export function ScoreBlock({ score, className }: ScoreBlockProps) {
  const verdict = getVerdict(score);
  const color = scoreBandColor(score);

  return (
    <div
      className={`inline-flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-4 text-center ${className ?? ""}`}
      style={{ color }}
    >
      <span className="text-2xl font-mono font-semibold tabular-nums text-foreground">
        {score}
      </span>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        /100
      </span>
      <span className="text-sm font-semibold">{verdict}</span>
    </div>
  );
}
