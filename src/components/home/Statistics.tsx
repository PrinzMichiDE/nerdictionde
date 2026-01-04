"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Gamepad2, Cpu, ShoppingCart, Film, Tv, TrendingUp, Star } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface StatisticsData {
  totalReviews: number;
  averageScore: number;
  gameReviews: number;
  hardwareReviews: number;
  amazonReviews: number;
  movieReviews?: number;
  seriesReviews?: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description?: string;
  delay?: number;
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

function StatCard({ icon, label, value, description, delay = 0 }: StatCardProps) {
  const isNumeric = typeof value === "number";
  const cardRef = useRef<HTMLDivElement>(null);
  const countUpValue = useCountUp(isNumeric ? value : 0, 2000, 0, cardRef);
  const displayValue = isNumeric ? countUpValue : value;

  return (
    <Card 
      ref={cardRef}
      className="relative overflow-hidden border-2 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30 group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors group-hover:scale-110">
                {icon}
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tabular-nums">
                {displayValue}{isNumeric && description?.includes("Punkten") ? "" : ""}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground/70">{description}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatisticsProps {
  data: StatisticsData;
}

export function Statistics({ data }: StatisticsProps) {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Statistiken</h2>
        <p className="text-muted-foreground">
          Zahlen und Fakten zu unseren Reviews
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        <StatCard
          icon={<Gamepad2 className="h-5 w-5" />}
          label="Gesamt Reviews"
          value={data.totalReviews}
          description="Veröffentlichte Reviews"
          delay={100}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Durchschnitt"
          value={data.averageScore.toFixed(1)}
          description="von 100 Punkten"
          delay={200}
        />
        <StatCard
          icon={<Gamepad2 className="h-5 w-5" />}
          label="Games"
          value={data.gameReviews}
          description="Spiele-Reviews"
          delay={300}
        />
        <StatCard
          icon={<Film className="h-5 w-5" />}
          label="Filme"
          value={data.movieReviews || 0}
          description="Film-Reviews"
          delay={350}
        />
        <StatCard
          icon={<Tv className="h-5 w-5" />}
          label="Serien"
          value={data.seriesReviews || 0}
          description="Serien-Reviews"
          delay={400}
        />
        <StatCard
          icon={<Cpu className="h-5 w-5" />}
          label="Hardware"
          value={data.hardwareReviews}
          description="Hardware-Reviews"
          delay={450}
        />
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Amazon"
          value={data.amazonReviews}
          description="Amazon-Reviews"
          delay={500}
        />
      </div>
    </section>
  );
}

