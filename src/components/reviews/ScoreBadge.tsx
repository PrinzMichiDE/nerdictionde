import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const getColorClasses = (score: number) => {
    if (score >= 90) return "bg-gradient-to-br from-green-500 to-green-600 text-white border-green-400/50";
    if (score >= 75) return "bg-gradient-to-br from-green-400 to-green-500 text-white border-green-300/50";
    if (score >= 50) return "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white border-yellow-300/50";
    if (score >= 25) return "bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-400/50";
    return "bg-gradient-to-br from-red-500 to-red-600 text-white border-red-400/50";
  };

  return (
    <div
      className={cn(
        "relative flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold",
        "border-2 shadow-xl backdrop-blur-sm",
        "transition-all duration-300 hover:scale-110",
        getColorClasses(score),
        className
      )}
      role="img"
      aria-label={`Score: ${score} von 100`}
    >
      <div className="absolute inset-0 rounded-full bg-white/20 blur-sm" />
      <span className="relative z-10">{score}</span>
    </div>
  );
}

