"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative flex flex-col items-center justify-center space-y-8 text-center py-20 md:py-32 lg:py-40 overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent rounded-3xl" />
      
      {/* Dynamic gradient that follows mouse */}
      <div
        className="absolute inset-0 opacity-30 rounded-3xl transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, hsl(var(--primary) / 0.15), transparent 50%)`,
        }}
      />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 rounded-3xl" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 space-y-8 px-4 max-w-5xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm animate-slide-up [animation-delay:0.1s] [animation-fill-mode:both]">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Professionelle Reviews seit 2024</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl animate-slide-up [animation-delay:0.2s] [animation-fill-mode:both]">
          <span className="block">Willkommen bei</span>
          <span className="block mt-2 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-gradient">
            Nerdiction
          </span>
        </h1>

        {/* Subheading */}
        <p className="max-w-[800px] mx-auto text-muted-foreground text-xl md:text-2xl leading-relaxed animate-slide-up [animation-delay:0.3s] [animation-fill-mode:both]">
          Professionelle Game- und Hardware-Reviews für fundierte Kaufentscheidungen.
          <span className="block mt-2 text-lg text-muted-foreground/80">
            Unabhängig • Objektiv • Transparent
          </span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 pt-6 animate-slide-up [animation-delay:0.4s] [animation-fill-mode:both]">
          <Button
            asChild
            size="lg"
            className="rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-lg px-8 py-6 h-auto group"
          >
            <Link href="/reviews" className="flex items-center gap-2">
              Alle Reviews entdecken
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="rounded-full border-2 hover:bg-accent hover:border-accent-foreground/20 transition-all hover:scale-105 text-lg px-8 py-6 h-auto backdrop-blur-sm bg-background/50"
          >
            <Link href="/reviews?sort=score-desc">Top Reviews</Link>
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground animate-slide-up [animation-delay:0.5s] [animation-fill-mode:both]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>100% Unabhängig</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
            <span>Professionelle Tests</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: "1s" }} />
            <span>Transparente Bewertungen</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-scroll-indicator" />
        </div>
      </div>
    </section>
  );
}
