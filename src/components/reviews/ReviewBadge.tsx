import { cn } from "@/lib/utils";
import { getVerdict, getScoreColor } from "@/lib/review-category";

interface ReviewBadgeProps {
  score: number;
  title: string;
  slug: string;
  isEn?: boolean;
}

function getVerdictEn(score: number): string {
  if (score >= 90) return "Phenomenal";
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 60) return "Solid";
  if (score >= 50) return "Mediocre";
  return "Disappointing";
}

export function ReviewBadge({ score, title, slug, isEn = false }: ReviewBadgeProps) {
  const safeScore = Math.max(0, Math.min(100, score));
  const color = getScoreColor(safeScore);
  const verdict = isEn ? getVerdictEn(safeScore) : getVerdict(safeScore);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nerdiction.de";
  const reviewUrl = `${siteUrl}/reviews/${slug}`;

  return (
    <a
      href={reviewUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(
        "inline-flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "group"
      )}
      aria-label={`${isEn ? "Tested by Nerdiction" : "Getestet von Nerdiction"}: ${title}, ${safeScore} von 100`}
    >
      {/* Nerdiction brand mark */}
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
        <span className="text-[10px] font-serif font-bold tracking-tight">N</span>
      </div>

      <div className="flex-1 min-w-0 text-[11px] leading-tight">
        <div className="font-semibold text-foreground/90 leading-none">
          {isEn ? "Tested by Nerdiction" : "Getestet von Nerdiction"}
        </div>
        <div className="text-[10px] text-muted-foreground leading-none">
          {verdict}
        </div>
      </div>

      {/* Score chip */}
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md",
          "text-[11px] font-bold font-mono tabular-nums",
          color === "var(--chart-3)" || color === "var(--chart-2)"
            ? "bg-card text-foreground"
            : "bg-foreground text-card"
        )}
        style={{ backgroundColor: color }}
      >
        {safeScore}
      </div>
    </a>
  );
}
