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
    <section className="relative border-b border-border pb-12 md:pb-16">
      <div className="relative z-10 grid items-end gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <h1 className="font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
            Ehrliche Produkttests.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Wir testen Games, Filme, Serien und Hardware und legen jede Wertung
            offen.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base font-semibold">
              <Link href="/reviews" className="group inline-flex items-center gap-2">
                Alle Tests lesen
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
            </Button>
            <Link
              href="#so-testen-wir"
              className="rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              So werten wir
            </Link>
          </div>

          {stats.length > 0 && (
            <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-background px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                  <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {latest && category && (
          <div className="lg:col-span-5">
            <Link
              href={`/reviews/${latest.slug}`}
              className="group block overflow-hidden rounded-sm border border-border bg-card transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                {image ? (
                  <Image
                    src={image}
                    alt={latest.title}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Kein Bild
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground">
                    Zuletzt getestet:{" "}
                    <span style={{ color: category.color }}>{category.label}</span>
                  </span>
                  <h2 className="mt-1 font-serif text-2xl font-semibold leading-snug text-balance">
                    {latest.title}
                  </h2>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className="font-serif text-2xl font-semibold tabular-nums"
                    style={{ color: getScoreColor(latest.score) }}
                  >
                    {latest.score}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {getVerdict(latest.score)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
                <span className="font-medium">Test lesen</span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
