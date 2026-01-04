"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Award, Trophy, Star, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface AwardItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  year?: string;
  color: string;
}

const awards: AwardItem[] = [
  {
    icon: <Trophy className="h-8 w-8" />,
    title: "Top Review Site 2024",
    description: "Ausgezeichnet für herausragende Qualität",
    year: "2024",
    color: "from-yellow-500/20 to-orange-500/20",
  },
  {
    icon: <Star className="h-8 w-8" />,
    title: "Community Choice",
    description: "Von der Community am meisten geschätzt",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Wachstums-Champion",
    description: "Schnellstes Wachstum in der Branche",
    color: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Exzellenz in Tests",
    description: "Höchste Standards in der Bewertung",
    color: "from-purple-500/20 to-pink-500/20",
  },
];

export function Awards() {
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
    <section ref={ref} className="space-y-8 py-16 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-2">
          <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
            Auszeichnungen
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Anerkennung & Erfolge
        </h2>
        <p className="text-muted-foreground text-lg">
          Unsere Errungenschaften und Auszeichnungen
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {awards.map((award, index) => (
          <Card
            key={index}
            className={`group relative overflow-hidden border-2 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 hover:border-yellow-500/30 ${
              isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
            }`}
            style={{ transitionDelay: `${index * 0.1}s` }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${award.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />
            <CardContent className="p-8 relative z-10 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/20 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-yellow-500/20 transition-all duration-300">
                  <div className="text-yellow-600 dark:text-yellow-500">
                    {award.icon}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {award.year && (
                  <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 uppercase tracking-wide">
                    {award.year}
                  </p>
                )}
                <h3 className="font-bold text-lg group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                  {award.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {award.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
