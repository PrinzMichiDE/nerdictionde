"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Wie werden die Reviews bewertet?",
    answer:
      "Unsere Bewertungen basieren auf einem transparenten 100-Punkte-System. Wir berücksichtigen verschiedene Faktoren wie Performance, Design, Funktionalität, Preis-Leistungs-Verhältnis und Benutzerfreundlichkeit. Jeder Review enthält eine detaillierte Aufschlüsselung der Bewertungskriterien.",
  },
  {
    question: "Sind die Reviews unabhängig?",
    answer:
      "Ja, absolut! Alle unsere Reviews sind vollständig unabhängig und objektiv. Wir akzeptieren keine bezahlten Reviews oder Produktplatzierungen, die unsere Bewertungen beeinflussen könnten. Unsere Redaktion testet alle Produkte selbstständig.",
  },
  {
    question: "Wie oft werden neue Reviews veröffentlicht?",
    answer:
      "Wir veröffentlichen regelmäßig neue Reviews, typischerweise mehrere pro Woche. Unser Ziel ist es, die neuesten Releases schnell zu testen und unsere Leser zeitnah zu informieren. Abonniere unseren Newsletter, um keine Reviews zu verpassen.",
  },
  {
    question: "Kann ich ein Produkt zur Review vorschlagen?",
    answer:
      "Ja, gerne! Wir freuen uns über Vorschläge von unserer Community. Du kannst uns über die Kontaktseite erreichen oder direkt eine E-Mail senden. Wir berücksichtigen alle Vorschläge bei unserer Redaktionsplanung.",
  },
  {
    question: "Wie werden Affiliate-Links verwendet?",
    answer:
      "Wir verwenden Affiliate-Links, um unsere Arbeit zu finanzieren. Diese Links beeinflussen jedoch nicht unsere Bewertungen oder Empfehlungen. Wenn du über unsere Links kaufst, unterstützt du unsere unabhängige Arbeit, ohne dass du mehr bezahlst.",
  },
  {
    question: "Können Hersteller ihre Produkte zur Review einreichen?",
    answer:
      "Ja, Hersteller können uns Produkte zur Review zur Verfügung stellen. Wir behalten uns jedoch das Recht vor, alle Produkte objektiv und nach unseren Standards zu bewerten. Eine Produktüberlassung garantiert keine positive Bewertung.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section ref={ref} className="space-y-8 py-16">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wide">
            Häufige Fragen
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Fragen & Antworten
        </h2>
        <p className="text-muted-foreground text-lg">
          Alles was du über unsere Reviews wissen musst
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <Card
            key={index}
            className={`group border-2 transition-all duration-500 hover:border-primary/30 hover:shadow-lg ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-0">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors group"
                aria-expanded={openIndex === index}
              >
                <h3 className="font-semibold text-lg pr-8 group-hover:text-primary transition-colors">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 pt-0">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
