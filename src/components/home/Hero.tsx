"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Gamepad2,
  Film,
  Tv,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react";

const rotatingWords = ["Games", "Filme", "Serien", "Hardware"];

const trustItems = [
  { icon: ShieldCheck, label: "100% unabhängig" },
  { icon: Star, label: "Transparente Scores" },
  { icon: Trophy, label: "Professionelle Tests" },
];

export function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const id = setInterval(
      () => setWordIndex((i) => (i + 1) % rotatingWords.length),
      2600
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const orbStyle = (depth: number, baseX: number, baseY: number) => ({
    transform: `translate3d(${mouse.x * depth}px, ${mouse.y * depth}px, 0)`,
    left: `${baseX}%`,
    top: `${baseY}%`,
  });

  return (
    <section className="full-bleed hero-vignette relative overflow-hidden -mt-8 md:-mt-12 lg:-mt-16 pb-20 md:pb-28 lg:pb-36">
      {/* ===== Hintergrund-Schichten ===== */}
      <div className="absolute inset-0 bg-mesh" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_20%,transparent_75%)]"
        aria-hidden="true"
      />
      <div className="absolute inset-0 noise opacity-[0.045] pointer-events-none" aria-hidden="true" />

      {/* Aurora-Orbs (Parallax auf Maus) */}
      <div
        aria-hidden="true"
        className="absolute w-[34rem] h-[34rem] rounded-full blur-[110px] animate-aurora pointer-events-none"
        style={{
          ...orbStyle(28, -12, -18),
          background: "color-mix(in oklab, var(--primary) 34%, transparent)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute w-[28rem] h-[28rem] rounded-full blur-[100px] animate-aurora pointer-events-none"
        style={{
          ...orbStyle(-18, 78, 10),
          background: "color-mix(in oklab, oklch(0.6 0.16 210) 26%, transparent)",
          animationDelay: "-6s",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute w-[26rem] h-[26rem] rounded-full blur-[110px] animate-aurora pointer-events-none"
        style={{
          ...orbStyle(14, 55, 68),
          background: "color-mix(in oklab, oklch(0.6 0.15 320) 20%, transparent)",
          animationDelay: "-12s",
        }}
      />

      {/* Rotierende Deko-Ringe */}
      <div
        aria-hidden="true"
        className="absolute -left-40 top-1/2 -translate-y-1/2 size-[36rem] rounded-full border border-dashed opacity-20 animate-ring-spin hidden lg:block"
        style={{ borderColor: "color-mix(in oklab, var(--primary) 60%, transparent)" }}
      />
      <div
        aria-hidden="true"
        className="absolute -right-48 top-1/3 size-[30rem] rounded-full border border-dashed opacity-15 animate-ring-spin-reverse hidden lg:block"
        style={{ borderColor: "color-mix(in oklab, var(--primary) 60%, transparent)" }}
      />

      {/* ===== Floatende Glaskarten ===== */}
      <div
        aria-hidden="true"
        className="hidden xl:block absolute right-[6%] top-[16%] animate-float-y-slow"
      >
        <div className="glass gradient-border rounded-2xl px-5 py-4 shadow-2xl shadow-primary/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            &quot;Endlich ehrliche Tests!&quot;
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">★ Leser der Woche</p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="hidden xl:block absolute left-[5%] bottom-[22%] animate-float-y"
      >
        <div className="glass gradient-border rounded-2xl px-5 py-4 shadow-2xl shadow-primary/10">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Redaktions-Favorit
          </p>
          <p className="mt-1 font-serif text-2xl font-semibold text-gradient">9.4 / 10</p>
          <p className="text-xs text-muted-foreground">Phänomenal</p>
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 lg:px-8 xl:px-12 pt-16 md:pt-24 lg:pt-32">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold animate-slide-up [animation-delay:0.05s] [animation-fill-mode:both]"
            style={{
              background: "color-mix(in oklab, var(--primary) 12%, transparent)",
              border: "1px solid color-mix(in oklab, var(--primary) 30%, transparent)",
              color: "var(--primary)",
            }}
          >
            <Sparkles className="size-4 animate-pulse" />
            Unabhängiges Nerd-Magazin
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-current" />
              <span className="relative inline-flex size-2 rounded-full bg-current" />
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-8 font-serif text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-semibold tracking-tight leading-[1.04] text-balance animate-slide-up [animation-delay:0.15s] [animation-fill-mode:both]">
            Ehrliche Reviews
            <span className="block mt-2">
              für{" "}
              <span className="relative inline-block" style={{ perspective: "800px" }}>
                <span key={wordIndex} className="animate-word text-gradient-animate">
                  {rotatingWords[wordIndex]}
                </span>
              </span>
            </span>
          </h1>

          {/* Subline */}
          <p className="mt-7 max-w-2xl text-base md:text-xl text-muted-foreground leading-relaxed text-pretty animate-slide-up [animation-delay:0.3s] [animation-fill-mode:both]">
            Nerdiction testet <strong className="font-semibold text-foreground">Games, Filme, Serien und Hardware</strong>{" "}
            unabhängig, transparent und mit Leidenschaft – damit du weißt, worauf du dich einlässt.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-slide-up [animation-delay:0.45s] [animation-fill-mode:both]">
            <Button
              asChild
              size="lg"
              className="shine group relative h-13 rounded-full px-8 py-4 text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Link href="/reviews" className="relative z-[2] inline-flex items-center gap-2">
                Reviews entdecken
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="group h-13 rounded-full px-8 py-4 text-base font-semibold border-2 backdrop-blur-sm bg-background/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent"
            >
              <Link href="/reviews?sort=score-desc" className="inline-flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                Top-Tests ansehen
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 animate-slide-up [animation-delay:0.6s] [animation-fill-mode:both]">
            {trustItems.map(({ icon: Icon, label }, i) => (
              <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon
                  className="size-4"
                  style={{ color: ["var(--primary)", "oklch(0.65 0.16 200)", "oklch(0.68 0.15 60)"][i % 3] }}
                />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Kategorie-Pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-slide-up [animation-delay:0.7s] [animation-fill-mode:both]">
            {[
              { icon: Gamepad2, label: "Games", href: "/reviews?category=game" },
              { icon: Film, label: "Filme", href: "/reviews?category=movie" },
              { icon: Tv, label: "Serien", href: "/reviews?category=series" },
            ].map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-background/60 backdrop-blur-sm px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-foreground hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
              >
                <Icon className="size-4 text-primary transition-transform group-hover:scale-110" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll-Indikator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground animate-slide-up [animation-delay:1s] [animation-fill-mode:both]">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em]">Scrollen</span>
        <span className="flex h-9 w-5 items-start justify-center rounded-full border border-muted-foreground/40 p-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-scroll-dot" />
        </span>
      </div>
    </section>
  );
}
