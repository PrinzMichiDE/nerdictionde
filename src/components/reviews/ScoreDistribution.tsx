import type { CSSProperties } from "react";

interface ScoreDistributionProps {
  data: number[];
  total: number;
}

const bucketLabels = [
  "0–9",
  "10–19",
  "20–29",
  "30–39",
  "40–49",
  "50–59",
  "60–69",
  "70–79",
  "80–89",
  "90–100",
];

export function ScoreDistribution({ data, total }: ScoreDistributionProps) {
  const buckets = Array.isArray(data) && data.length === 10 ? data : Array.from({ length: 10 }, () => 0);
  const max = Math.max(...buckets, 1);
  const bucketTotal = buckets.reduce((a, b) => a + b, 0);
  const weightedSum = buckets.reduce((acc, count, i) => acc + count * (i * 10 + 5), 0);
  const avg = bucketTotal > 0 ? Math.round(weightedSum / bucketTotal) : 0;

  return (
    <section className="rounded-sm border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <span className="kicker text-primary">01 · Wertungs-Index</span>
          <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
            So verteilen sich die Scores
          </h2>
        </div>
        <span className="kicker text-muted-foreground" style={{ fontSize: "0.625rem" }}>
          {total} {total === 1 ? "Review" : "Reviews"}
        </span>
      </div>

      <div className="px-5 py-6 md:px-6">
        <div className="dist-track">
          {bucketTotal > 0 && (
            <div className="dist-avg" style={{ left: `${avg}%` }}>
              <span className="dist-avg-label">Ø {avg}</span>
            </div>
          )}
          {buckets.map((count, i) => {
            const pct = count > 0 ? Math.round((count / max) * 100) : 0;
            const peak = count > 0 && count === max;
            return (
              <div key={i} className="dist-col" data-peak={peak}>
                <span className="dist-count">{count > 0 ? count : ""}</span>
                <div
                  className="dist-fill"
                  style={
                    {
                      "--bar-h": `${Math.max(pct, count > 0 ? 5 : 0)}%`,
                      transitionDelay: `${i * 55}ms`,
                    } as CSSProperties
                  }
                />
                <span className="dist-label">{bucketLabels[i]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
