import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

const chartVar = (score: number): string =>
  score >= 90 ? "chart-5"
    : score >= 75 ? "chart-4"
    : score >= 50 ? "chart-3"
    : score >= 25 ? "chart-2"
    : "chart-1";

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const numericScore = typeof score === 'number' ? score : Number(score) || 0;
  const safeScore = isNaN(numericScore) ? 0 : Math.max(0, Math.min(100, numericScore));
  const color = `var(--${chartVar(safeScore)})`;

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-md text-base font-bold tabular-nums",
        className
      )}
      style={{ backgroundColor: color, color: "var(--card)" }}
      role="img"
      aria-label={`Score: ${safeScore} von 100`}
    >
      {safeScore}
    </div>
  );
}
