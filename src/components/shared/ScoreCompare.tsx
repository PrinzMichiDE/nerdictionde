import { ScoreBlock } from "./ScoreBlock";

interface ScoreCompareProps {
  reviewScore: number;
  categoryAverage: number | null;
  categoryLabel: string;
}

export function ScoreCompare({ reviewScore, categoryAverage, categoryLabel }: ScoreCompareProps) {
  if (categoryAverage === null) return null;

  const diff = reviewScore - categoryAverage;
  const above = diff >= 0;

  return (
    <div className="space-y-3">
      <h4 className="kicker text-xs">Vergleich {categoryLabel}</h4>
      <div className="flex items-center gap-4">
        <div className="space-y-0.5">
          <ScoreBlock score={reviewScore} />
          <div className="text-center text-[10px] text-muted-foreground">Dieser Test</div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Durchschnitt</span>
            <span className="font-semibold tabular-nums">{categoryAverage}/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-muted-foreground/30"
              style={{ width: `${categoryAverage}%` }}
            />
          </div>
          <div
            className="text-xs font-semibold tabular-nums"
            style={{
              color: above
                ? "oklch(0.58 0.15 145)"
                : "oklch(0.55 0.2 15)",
            }}
          >
            {above ? `+${diff}` : diff} Punkte
          </div>
        </div>
      </div>
    </div>
  );
}
