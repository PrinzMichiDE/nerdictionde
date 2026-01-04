"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Building2, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface Partner {
  name: string;
  description: string;
  logo?: string;
  category: "publisher" | "hardware" | "platform" | "media";
}

const partners: Partner[] = [
  {
    name: "Steam",
    description: "Gaming Platform Partner",
    category: "platform",
  },
  {
    name: "IGDB",
    description: "Game Database Integration",
    category: "platform",
  },
  {
    name: "TMDB",
    description: "Movie & Series Database",
    category: "platform",
  },
  {
    name: "Amazon Associates",
    description: "Affiliate Partner",
    category: "platform",
  },
];

const categoryColors = {
  publisher: "from-blue-500/20 to-cyan-500/20",
  hardware: "from-purple-500/20 to-pink-500/20",
  platform: "from-green-500/20 to-emerald-500/20",
  media: "from-orange-500/20 to-red-500/20",
};

export function Partners() {
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
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wide">
            Partner & Integrationen
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Unsere Partner
        </h2>
        <p className="text-muted-foreground text-lg">
          Vertrauensvolle Zusammenarbeit mit führenden Plattformen
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {partners.map((partner, index) => (
          <Card
            key={partner.name}
            className={`group relative overflow-hidden border-2 transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 hover:border-primary/30 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: `${index * 0.1}s` }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${categoryColors[partner.category]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />
            <CardContent className="p-8 relative z-10 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/20 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                  {partner.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {partner.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-8">
        <p className="text-sm text-muted-foreground">
          Interessiert an einer Partnerschaft?{" "}
          <a
            href="/kooperationen"
            className="text-primary hover:underline font-medium"
          >
            Kontaktiere uns
          </a>
        </p>
      </div>
    </section>
  );
}
