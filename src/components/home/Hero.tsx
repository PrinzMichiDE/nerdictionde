import Image from "next/image";
import Link from "next/link";
import type { Review } from "@/types/review";
import { Button } from "@/components/ui/button";
import { getCategoryStyle, getScoreColor, getVerdict } from "@/lib/review-category";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  latest: Review | null;
  stats: { label: string; value: string }[];
}

export function Hero({ latest, stats }: HeroProps) {
  const image = latest?.images?.[0];
  const category = latest ? getCategoryStyle(latest.category) : null;

  return (
    <section className="magazine-hero magazine-section relative" aria-labelledby="hero-title">
      <div className="magazine-hero-content" id="hero-title">
        <span className="magazine-hero-badge">
          <span className="kicker-line" aria-hidden="true"></span>
          Editorial
        </span>
        <h1 className="magazine-hero-title text-balance">
          Ehrliche Produkttests.<br className="hidden md:block" />
          <span className="block md:inline">Ohne bezahlte Platzierungen.</span>
        </h1>
        <p className="magazine-hero-lede">
          Wir testen Games, Filme, Serien und Hardware und legen jede Wertung
          offen. Unabhängig, transparent und mit System.
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <Button asChild size="lg" className="h-12 rounded-full px-7 text-base font-semibold group">
            <Link href="/reviews" className="inline-flex items-center gap-2">
              Alle Tests lesen
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </Button>
          <Link
            href="#so-testen-wir"
            className="magazine-section-link"
          >
            So werten wir
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {stats.length > 0 && (
          <dl className="magazine-hero-stats" role="list" aria-label="Statistiken">
            {stats.map((stat) => (
              <div key={stat.label} className="magazine-stat">
                <dd className="magazine-stat-value">{stat.value}</dd>
                <dt className="magazine-stat-label">{stat.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>

      {latest && category && (
        <div className="magazine-hero-featured">
          <Link
            href={`/reviews/${latest.slug}`}
            className="magazine-featured-card group block spotlight-card"
            aria-label={`${latest.title}, ${latest.score} von 100`}
          >
            <div className="magazine-featured-image relative aspect-[16/9] overflow-hidden bg-muted shine">
              {image ? (
                <Image
                  src={image}
                  alt={latest.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover spotlight-img"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Kein Bild
                </div>
              )}
              <span className="magazine-featured-category" style={{ background: category.color }}>
                {category.label}
              </span>
            </div>

            <div className="magazine-featured-content">
              <div className="magazine-featured-meta">
                <time dateTime={new Date(latest.createdAt).toISOString()} className="text-xs">
                  {new Date(latest.createdAt).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>
              <h2 className="magazine-featured-title">{latest.title}</h2>

              <div className="magazine-featured-footer">
                <div className="magazine-featured-score">
                  <span className="magazine-featured-score-value" style={{ color: getScoreColor(latest.score) }}>
                    {latest.score}
                  </span>
                  <span className="magazine-featured-score-label">von 100</span>
                </div>
                <span className="magazine-featured-verdict">{getVerdict(latest.score)}</span>
                <span className="magazine-featured-read">
                  Test lesen
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </section>
  );
}
