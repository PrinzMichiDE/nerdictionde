import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  // Ensure score is a valid number
  const numericScore = typeof score === 'number' ? score : Number(score) || 0;
  const safeScore = isNaN(numericScore) ? 0 : Math.max(0, Math.min(100, numericScore));

  const getColorClasses = (score: number) => {
    if (score >= 90) return "bg-green-600 text-white";
    if (score >= 75) return "bg-lime-600 text-white";
    if (score >= 50) return "bg-amber-500 text-white";
    if (score >= 25) return "bg-orange-600 text-white";
    return "bg-red-600 text-white";
  };

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-md text-base font-bold tabular-nums",
        getColorClasses(safeScore),
        className
      )}
      role="img"
      aria-label={`Score: ${safeScore} von 100`}
    >
      {safeScore}
    </div>
  );
}
