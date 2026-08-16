import Link from "next/link";
import { type CSSProperties } from "react";
import { Review } from "@/types/review";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { SectionHeading } from "./SectionHeading";
import { ScrollReveal } from "./ScrollReveal";
import { Trophy, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  game: "Games",
  movie: "Filme",
  series: "Serien",
};

interface LeaderboardProps {
  reviews: Review[];
}

function rankClasses(index: number): string {
  if (index === 0) return "rank-gold shadow-lg";
  if (index === 1) return "rank-silver shadow-md";
  if (index === 2) return "rank-bronze shadow-md";
  return "bg-muted text-muted-foreground border border-border";
}

export function Leaderboard({ reviews }: LeaderboardProps) {
  if (reviews.length === 0) return null;

  return (
    <section className="space-y-10 md:space-y-12">
      <SectionHeading
        kicker="Redaktions-Favoriten"
        title={<>Die <span className="text-gradient">besten Tests</span></>}
        description="Unsere Top-Bewertungen aller Zeiten – das Maximum für deine Kaufentscheidung."
      />

      <ScrollReveal variant="fade">
        <ol className="space-y-3">
          {reviews.slice(0, 6).map((review, i) => (
            <li key={review.id}>
              <Link
                href={`/reviews/${review.slug}`}
                className="group relative grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,2fr)_auto] items-center gap-4 md:gap-6 overflow-hidden rounded-2xl border border-border bg-card p-4 md:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div
                  className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary to-transparent transition-transform duration-500 group-hover:scale-x-100"
                  aria-hidden="true"
                />

                {/* Rang */}
                <span
                  className={cn(
                    "inline-flex size-11 items-center justify-center rounded-xl font-serif text-lg font-bold tabular-nums",
                    rankClasses(i)
                  )}
                >
                  {i === 0 ? (
                    <Trophy className="size-5" aria-hidden="true" />
                  ) : (
                    i + 1
                  )}
                </span>

                {/* Titel */}
                <div className="min-w-0">
                  <span className="kicker text-primary">
                    {categoryLabels[review.category] || review.category}
                  </span>
                  <h3 className="truncate font-serif text-lg md:text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                    {review.title}
                  </h3>
                </div>

                {/* Score-Bar */}
                <div className="hidden md:flex flex-1 items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="bar-grow h-full rounded-full bg-primary bar-stripes"
                      style={{ "--bar-w": `${review.score}%` } as CSSProperties}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {review.score}/100
                  </span>
                </div>

                {/* Score-Badge + Arrow */}
                <div className="flex items-center gap-3">
                  <ScoreBadge score={review.score} className="h-12 w-12 text-lg shadow-lg" />
                  <ArrowUpRight className="hidden sm:block size-5 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </ScrollReveal>

      <ScrollReveal variant="fade" delay={100} className="flex justify-center">
        <Link
          href="/reviews?sort=score-desc"
          className="group inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-all duration-300 hover:border-primary/40 hover:text-primary hover:shadow-lg hover:shadow-primary/10"
        >
          Alle Top-Reviews ansehen
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </ScrollReveal>
    </section>
  );
}
