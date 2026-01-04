"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Quote, ExternalLink, Newspaper } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface Mention {
  source: string;
  quote: string;
  date: string;
  link?: string;
}

const mentions: Mention[] = [
  {
    source: "Gaming Magazine",
    quote: "Nerdiction setzt neue Maßstäbe in der Review-Branche mit detaillierten und objektiven Tests.",
    date: "Januar 2024",
  },
  {
    source: "Tech Review Portal",
    quote: "Eine der vertrauenswürdigsten Quellen für Hardware-Reviews im deutschsprachigen Raum.",
    date: "Dezember 2023",
  },
  {
    source: "Gaming Community Blog",
    quote: "Die Reviews sind nicht nur informativ, sondern auch für Einsteiger verständlich aufbereitet.",
    date: "November 2023",
  },
];

export function PressMentions() {
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
          <Newspaper className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wide">
            Presse & Medien
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Über uns wird gesprochen
        </h2>
        <p className="text-muted-foreground text-lg">
          Was Medien und Experten über uns sagen
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {mentions.map((mention, index) => (
          <Card
            key={index}
            className={`group relative overflow-hidden border-2 transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 hover:border-primary/30 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: `${index * 0.15}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardContent className="p-8 relative z-10 space-y-4">
              {/* Quote Icon */}
              <div className="flex justify-start">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Quote className="h-5 w-5" />
                </div>
              </div>

              {/* Quote */}
              <p className="text-muted-foreground leading-relaxed italic text-lg">
                "{mention.quote}"
              </p>

              {/* Source */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{mention.source}</p>
                  <p className="text-sm text-muted-foreground">{mention.date}</p>
                </div>
                {mention.link && (
                  <a
                    href={mention.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
