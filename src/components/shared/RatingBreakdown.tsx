interface RatingBreakdownProps {
  scores: {
    label: string;
    value: number;
  }[];
}

const chartVar = (value: number): string =>
  value >= 90 ? "--chart-5" : value >= 75 ? "--chart-4" : value >= 60 ? "--chart-3" : value >= 50 ? "--chart-2" : "--chart-1";

const scoreVerdict = (value: number): string =>
  value >= 90 ? "Phänomenal" : value >= 80 ? "Hervorragend" : value >= 70 ? "Gut" : value >= 60 ? "Solide" : value >= 50 ? "Mittelmaß" : "Enttäuschend";

export function RatingBreakdown({ scores }: RatingBreakdownProps) {
  return (
    <div className="space-y-4">
      <h4 className="kicker text-xs">Bewertungsdetails</h4>
      <div className="space-y-3">
        {scores.map((s) => (
          <div key={s.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/80">{s.label}</span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: `var(${chartVar(s.value)})` }}
              >
                {s.value}/100
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${s.value}%`,
                  backgroundColor: `var(${chartVar(s.value)})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-border text-xs text-muted-foreground">
        {scores.map((s) => (
          <div key={s.label} className="flex justify-between">
            <span>{s.label}:</span>
            <span>{scoreVerdict(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
