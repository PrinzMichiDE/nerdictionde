"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, Award, Zap } from "lucide-react";

interface ParallaxSectionProps {
  children?: React.ReactNode;
}

export function ParallaxSection({ children }: ParallaxSectionProps) {
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const scrolled = window.scrollY;
        setScrollY(scrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.3;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-32"
      style={{
        transform: `translateY(${parallaxOffset}px)`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

interface FeatureHighlight {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const highlights: FeatureHighlight[] = [
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: "Premium Content",
    description: "Höchste Qualitätsstandards in jedem Review",
    color: "from-yellow-500/20 to-orange-500/20",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Immer Aktuell",
    description: "Die neuesten Releases getestet und bewertet",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Ausgezeichnet",
    description: "Von der Community hoch bewertet",
    color: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Schnell & Präzise",
    description: "Reviews kurz nach Release verfügbar",
    color: "from-green-500/20 to-emerald-500/20",
  },
];

export function ParallaxHighlights() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <ParallaxSection>
      <div ref={ref} className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Was uns auszeichnet
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Professionelle Reviews mit höchsten Ansprüchen
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((highlight, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden border-2 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 0.15}s` }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${highlight.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <CardContent className="p-8 relative z-10 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-2xl bg-background/50 backdrop-blur-sm border-2 group-hover:scale-110 transition-transform duration-300">
                    {highlight.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold">{highlight.title}</h3>
                <p className="text-muted-foreground text-sm">{highlight.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
}
