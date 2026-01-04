"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { useEffect, useState } from "react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Max Mustermann",
    role: "Gaming-Enthusiast",
    content: "Die Reviews auf Nerdiction haben mir bei meiner letzten Hardware-Entscheidung enorm geholfen. Endlich mal ehrliche und detaillierte Tests!",
    rating: 5,
  },
  {
    name: "Sarah Schmidt",
    role: "Casual Gamer",
    content: "Als Einsteigerin finde ich die Reviews super verständlich. Die Bewertungskriterien sind klar und nachvollziehbar. Top!",
    rating: 5,
  },
  {
    name: "Tom Weber",
    role: "Hardware-Sammler",
    content: "Professionelle Tests mit echten Benchmarks und praxisnahen Erfahrungen. Genau das, was ich gesucht habe!",
    rating: 5,
  },
];

export function Testimonials() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("testimonials-section");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return (
    <section id="testimonials-section" className="space-y-8 py-16">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-2">
          <Quote className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wide">
            Community Feedback
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Was unsere Leser sagen
        </h2>
        <p className="text-muted-foreground text-lg">
          Echte Meinungen von echten Nutzern
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <Card
            key={index}
            className={`group relative overflow-hidden border-2 transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 hover:border-primary/30 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: `${index * 0.15}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardContent className="p-6 relative z-10 space-y-4">
              {/* Quote Icon */}
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Quote className="h-5 w-5" />
                </div>
                <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <p className="text-muted-foreground leading-relaxed italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="pt-4 border-t border-border">
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
