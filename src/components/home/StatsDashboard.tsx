"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, Target } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface StatData {
  label: string;
  value: number;
  max: number;
  color: string;
}

function useCountUp(end: number, duration: number = 2000, start: number = 0, ref: React.RefObject<HTMLDivElement | null>): number {
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

interface StatsDashboardProps {
  statistics: {
    totalReviews: number;
    averageScore: number;
    gameReviews: number;
    hardwareReviews: number;
    productReviews: number;
    movieReviews: number;
    seriesReviews: number;
  };
}

export function StatsDashboard({ statistics }: StatsDashboardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const stats: StatData[] = [
    {
      label: "Games",
      value: statistics.gameReviews,
      max: statistics.totalReviews,
      color: "bg-blue-500",
    },
    {
      label: "Hardware",
      value: statistics.hardwareReviews,
      max: statistics.totalReviews,
      color: "bg-purple-500",
    },
    {
      label: "Produkte",
      value: statistics.productReviews,
      max: statistics.totalReviews,
      color: "bg-orange-500",
    },
    {
      label: "Filme",
      value: statistics.movieReviews,
      max: statistics.totalReviews,
      color: "bg-red-500",
    },
    {
      label: "Serien",
      value: statistics.seriesReviews,
      max: statistics.totalReviews,
      color: "bg-green-500",
    },
  ];

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

  const cardRef = useRef<HTMLDivElement>(null);
  const animatedTotal = useCountUp(statistics.totalReviews, 2000, 0, cardRef);
  const animatedAverage = useCountUp(Math.round(statistics.averageScore), 2000, 0, cardRef);

  return (
    <section ref={ref} className="space-y-8 py-16 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wide">
            Interaktives Dashboard
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Detaillierte Statistiken
        </h2>
        <p className="text-muted-foreground text-lg">
          Übersichtliche Darstellung unserer Review-Daten
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Key Metrics */}
        <Card className="lg:col-span-2 border-2 hover:border-primary/30 transition-all duration-500 hover:shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">Review-Verteilung</h3>
            </div>

            <div className="space-y-4">
              {stats.map((stat, index) => {
                const percentage = stat.max > 0 ? (stat.value / stat.max) * 100 : 0;
                const barRef = useRef<HTMLDivElement>(null);
                const animatedValue = useCountUp(stat.value, 2000, 0, barRef);

                return (
                  <div
                    key={stat.label}
                    ref={barRef}
                    className={`space-y-2 ${
                      isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    }`}
                    style={{ transitionDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stat.label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {animatedValue} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stat.color} transition-all duration-1000 ease-out rounded-full`}
                        style={{
                          width: isVisible ? `${percentage}%` : "0%",
                          transitionDelay: `${index * 0.1}s`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="space-y-6">
          <Card ref={cardRef} className="border-2 hover:border-primary/30 transition-all duration-500 hover:shadow-xl">
            <CardContent className="p-8 text-center space-y-4">
              <div className="p-4 rounded-xl bg-primary/10 text-primary w-fit mx-auto">
                <Target className="h-8 w-8" />
              </div>
              <div>
                <p className="text-4xl font-bold tabular-nums">{animatedTotal}</p>
                <p className="text-muted-foreground mt-2">Gesamt Reviews</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-500 hover:shadow-xl">
            <CardContent className="p-8 text-center space-y-4">
              <div className="p-4 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 w-fit mx-auto">
                <Calendar className="h-8 w-8" />
              </div>
              <div>
                <p className="text-4xl font-bold tabular-nums">{animatedAverage}</p>
                <p className="text-muted-foreground mt-2">Durchschnitts-Score</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
