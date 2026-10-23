"use client";

import Image from "next/image";
import Link from "next/link";
import type { Review } from "@/types/review";
import { Button } from "@/components/ui/button";
import { getCategoryStyle, getVerdict } from "@/lib/review-category";
import { ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/home/SpotlightCard";

interface HeroProps {
  latest: Review | null;
  stats: { label: string; value: string }[];
}

export function Hero({ latest, stats }: HeroProps) {
  const image = latest?.images?.[0];
  const category = latest ? getCategoryStyle(latest.category) : null;

  return (
    <section className="relative border-b border-border pb-12 md:pb-16 overflow-hidden">
      {/* Aurora-Hintergrund (dekorativ, reduziert bei Reduced Motion) */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="animate-blob rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            background: "color-mix(in oklab, var(--primary) 35%, transparent)",
            width: "40rem",
            height: "40rem",
            top: "-10%",
            left: "10%",
          }}
          aria-hidden="true"
        />
        <div
          className="animate-blob rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[spin-slow_26s_linear_infinite_reverse]"
          style={{
            background: "color-mix(in oklab, var(--chart-2) 30%, transparent)",
            width: "34rem",
            height: "34rem",
            top: "10%",
            right: "10%",
            animationDelay: "-8s",
          }}
          aria-hidden="true"
        />
        <div className="hero-scan" aria-hidden="true" />
      </div>

      <div className="relative z-10 grid items-end gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="kicker-line" aria-hidden="true" />
            <span className="kicker text-primary font-semibold uppercase tracking-wider">
              Magazin
            </span>
          </div>
          <div className="relative inline-block mb-6">
            <span
              className="ghost-num text-[4rem] md:text-[6rem] lg:text-[8rem] select-none"
              aria-hidden="true"
            >
              01
            </span>
            <h1 className="font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl xl:text-[5.5rem] -mt-6 relative z-10">
              Ehrliche Produkttests.
            </h1>
          </div>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Wir testen Games, Filme, Serien und Hardware und legen jede Wertung
            offen.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base font-semibold">
              <Link href="/reviews" className="group inline-flex items-center gap-2">
                Alle Tests lesen
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
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
            <SpotlightCard tilt intensity={4} className="h-full">
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
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Kein Bild
                    </div>
                  )}
                  <span
                    className="absolute left-3 top-3 rounded-sm bg-background px-2 py-1 text-xs font-medium"
                    style={{ color: category.color }}
                  >
                    {category.label}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground">Zuletzt getestet</span>
                    <h2 className="mt-1 font-serif text-2xl font-semibold leading-snug text-balance transition-colors group-hover:text-primary">
                      {latest.title}
                    </h2>
                  </div>
                  <div
                    className="shrink-0 rounded-sm border border-border bg-card px-3 py-2 text-center"
                    style={{
                      color:
                        latest.score >= 90
                          ? "var(--chart-3)"
                          : latest.score >= 75
                            ? "var(--chart-2)"
                            : latest.score >= 50
                              ? "var(--chart-4)"
                              : latest.score >= 25
                                ? "var(--chart-1)"
                                : "var(--destructive)",
                    }}
                  >
                    <span className="font-serif text-xl font-semibold tabular-nums">
                      {latest.score}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {getVerdict(latest.score)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
                  <span className="font-medium">Test lesen</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </Link>
            </SpotlightCard>
          </div>
        )}
      </div>
    </section>
  );
}
