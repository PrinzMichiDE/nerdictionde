"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Newspaper, Star, Gamepad2, Clapperboard, TrendingUp } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

interface StatsBarProps {
  stats: {
    totalReviews: number;
    averageScore: number;
    gameReviews: number;
    movieReviews: number;
    seriesReviews: number;
  };
}

interface StatItem {
  icon: ReactNode;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  tint: string;
}

function useCountUp(end: number, decimals = 0) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const duration = 1800;
    let startTime: number | null = null;

    const step = (now: number) => {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(parseFloat((end * eased).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(end);
    };

    requestAnimationFrame(step);
  }, [started, end, decimals]);

  return { ref, value };
}

function StatCard({ item, index }: { item: StatItem; index: number }) {
  const { ref, value } = useCountUp(item.value, item.decimals ?? 0);
  const display = item.decimals
    ? value.toFixed(item.decimals)
    : Math.round(value).toLocaleString("de-DE");

  return (
    <ScrollReveal variant="up" delay={index * 110} className="h-full">
      <div
        ref={ref}
        className="glass gradient-border relative h-full overflow-hidden rounded-2xl p-6 md:p-7 transition-transform duration-500 hover:-translate-y-1.5 card-glow"
      >
        <div
          className="absolute -top-10 -right-10 size-28 rounded-full blur-2xl opacity-60 transition-opacity duration-500"
          style={{ background: item.tint }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3">
            <span
              className="inline-flex size-11 items-center justify-center rounded-xl border"
              style={{
                background: "color-mix(in oklab, var(--primary) 12%, transparent)",
                borderColor: "color-mix(in oklab, var(--primary) 25%, transparent)",
                color: "var(--primary)",
              }}
            >
              {item.icon}
            </span>
            <p className="font-serif text-4xl md:text-5xl font-semibold tracking-tight tabular-nums">
              {display}
              {item.suffix && (
                <span className="text-2xl text-muted-foreground font-normal">{item.suffix}</span>
              )}
            </p>
            <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          </div>
          <TrendingUp className="size-5 text-emerald-500 shrink-0" aria-hidden="true" />
        </div>
        <div className="relative z-10 mt-5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-1000 ease-out"
            style={{
              width: item.decimals
                ? `${Math.min(100, Math.max(4, item.value))}%`
                : "100%",
            }}
          />
        </div>
      </div>
    </ScrollReveal>
  );
}

export function StatsBar({ stats }: StatsBarProps) {
  const items: StatItem[] = [
    {
      icon: <Newspaper className="size-5" />,
      label: "Reviews veröffentlicht",
      value: stats.totalReviews,
      tint: "color-mix(in oklab, var(--primary) 30%, transparent)",
    },
    {
      icon: <Star className="size-5" />,
      label: "Durchschnitts-Score",
      value: stats.averageScore,
      decimals: 1,
      suffix: "/100",
      tint: "color-mix(in oklab, oklch(0.65 0.16 60) 28%, transparent)",
    },
    {
      icon: <Gamepad2 className="size-5" />,
      label: "Games getestet",
      value: stats.gameReviews,
      tint: "color-mix(in oklab, oklch(0.6 0.15 200) 28%, transparent)",
    },
    {
      icon: <Clapperboard className="size-5" />,
      label: "Filme & Serien",
      value: stats.movieReviews + stats.seriesReviews,
      tint: "color-mix(in oklab, oklch(0.62 0.15 320) 26%, transparent)",
    },
  ];

  return (
    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Nerdiction in Zahlen">
      {items.map((item, i) => (
        <StatCard key={item.label} item={item} index={i} />
      ))}
    </section>
  );
}
