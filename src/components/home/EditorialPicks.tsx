import Link from "next/link";
import type { Review } from "@/types/review";
import { getCategoryStyle, getScoreColor, getVerdict } from "@/lib/review-category";
import { ArrowRight } from "lucide-react";

interface EditorialPicksProps {
  reviews: Review[];
}

export function EditorialPicks({ reviews }: EditorialPicksProps) {
  const picks = [...reviews].sort((a, b) => b.score - a.score).slice(0, 3);

  if (picks.length === 0) return null;

  return (
    <section className="magazine-picks magazine-section" aria-labelledby="picks-title">
      <header className="magazine-section-header">
        <h2 id="picks-title" className="magazine-section-title">Redaktionstipps</h2>
        <Link
          href="/reviews?sort=score"
          className="magazine-section-link"
        >
          Alle Bestbewerteten
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </header>

      <ol className="magazine-picks-list" role="list" aria-label="Top 3 Redaktionstipps">
        {picks.map((review, index) => {
          const style = getCategoryStyle(review.category);

          return (
            <li key={review.id} className="magazine-pick">
              <span className="magazine-pick-rank" aria-label={`Platz ${index + 1}`}>
                {index + 1}
              </span>

              <div className="magazine-pick-content">
                <span className="magazine-pick-category" style={{ color: style.color }}>
                  {style.label}
                </span>
                <h3 className="magazine-pick-title">{review.title}</h3>
                <p className="magazine-pick-verdict">{getVerdict(review.score)}</p>
              </div>

              <div className="magazine-pick-score">
                <span className="magazine-pick-score-value" style={{ color: getScoreColor(review.score) }}>
                  {review.score}
                </span>
                <span className="magazine-pick-score-label">von 100</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}