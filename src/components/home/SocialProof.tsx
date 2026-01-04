"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Eye, ThumbsUp, Share2, TrendingUp, Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface Metric {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  color: string;
}

function useCountUp(end: number, duration: number = 2000, start: number = 0, ref: React.RefObject<HTMLDivElement>): number {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [isVisible, ref]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const current = Math.floor(start + (end - start) * easeOutCubic(progress));
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);

  return isVisible ? count : start;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const metrics: Metric[] = [
  {
    icon: <Users className="h-6 w-6" />,
    label: "Monatliche Besucher",
    value: "50K+",
    description: "Wachsendes Publikum",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: <Eye className="h-6 w-6" />,
    label: "Seitenaufrufe",
    value: "200K+",
    description: "Pro Monat",
    color: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: <ThumbsUp className="h-6 w-6" />,
    label: "Positive Bewertungen",
    value: "95%",
    description: "Zufriedenheitsrate",
    color: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: <Share2 className="h-6 w-6" />,
    label: "Social Shares",
    value: "10K+",
    description: "Geteilte Inhalte",
    color: "from-orange-500/20 to-red-500/20",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    label: "Wachstum",
    value: "+150%",
    description: "Im letzten Jahr",
    color: "from-yellow-500/20 to-orange-500/20",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    label: "Durchschnittliche Lesezeit",
    value: "5 Min",
    description: "Pro Review",
    color: "from-indigo-500/20 to-blue-500/20",
  },
];

export function SocialProof() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
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
    <section ref={ref} className="space-y-8 py-16">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wide">
            Social Proof
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Unsere Zahlen sprechen für sich
        </h2>
        <p className="text-muted-foreground text-lg">
          Vertrauen durch Transparenz und Leistung
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className={`group relative overflow-hidden border-2 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: `${index * 0.1}s` }}
          >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <CardContent className="p-8 relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    {metric.icon}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-bold tabular-nums group-hover:text-primary transition-colors">
                    {metric.value}
                  </p>
                  <h3 className="font-semibold text-lg">{metric.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </CardContent>
            </Card>
        ))}
      </div>
    </section>
  );
}
