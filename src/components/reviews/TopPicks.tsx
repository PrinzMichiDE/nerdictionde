import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { getCategoryStyle } from "@/lib/review-category";

export interface TopPick {
  id: string;
  title: string;
  slug: string;
  score: number;
  category: string;
}

interface TopPicksProps {
  picks: TopPick[];
}

export function TopPicks({ picks }: TopPicksProps) {
  if (!picks || picks.length === 0) return null;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-foreground pb-3">
        <div>
          <span className="kicker text-primary">02 · Empfehlungen</span>
          <h2 className="mt-1 font-serif text-2xl md:text-3xl font-semibold tracking-tight">
            Redaktions-Tipps
          </h2>
        </div>
        <Link
          href="/reviews?sort=score-desc"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          Alle Besten
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-2">
        {picks.map((pick, i) => {
          const style = getCategoryStyle(pick.category);
          return (
            <div key={pick.id}>
              <Link
                href={`/reviews/${pick.slug}`}
                className="pick-row group"
                aria-label={pick.title}
              >
                <span className="pick-index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <span className="kicker" style={{ color: style.color }}>
                    {style.label}
                  </span>
                  <h3 className="truncate font-serif text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
                    {pick.title}
                  </h3>
                </div>

                <ScoreRing score={pick.score} size={44} ringWidth={3} className="shrink-0" />
                <ArrowRight className="pick-arrow size-4 shrink-0 text-primary" />
              </Link>
              {i < picks.length - 1 && <div className="pick-rule" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
