"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { ScrollReveal } from "./ScrollReveal";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Wie werden die Reviews bewertet?",
    answer:
      "Unsere Bewertungen basieren auf einem transparenten 100-Punkte-System. Wir berücksichtigen Faktoren wie Performance, Design, Funktionalität, Preis-Leistungs-Verhältnis und Benutzerfreundlichkeit. Jeder Review enthält eine detaillierte Aufschlüsselung der Bewertungskriterien.",
  },
  {
    question: "Sind die Reviews wirklich unabhängig?",
    answer:
      "Ja, absolut! Wir akzeptieren keine bezahlten Reviews oder Produktplatzierungen, die unsere Bewertungen beeinflussen könnten. Unsere Redaktion testet alle Produkte selbstständig und ehrlich.",
  },
  {
    question: "Wie oft erscheinen neue Reviews?",
    answer:
      "Wir veröffentlichen regelmäßig neue Reviews – typischerweise mehrere pro Woche. Abonniere unseren Newsletter, um keine Tests zu verpassen.",
  },
  {
    question: "Kann ich ein Produkt zur Review vorschlagen?",
    answer:
      "Ja, gerne! Wir freuen uns über Vorschläge aus unserer Community. Schreib uns einfach über die Kontaktseite – wir berücksichtigen alle Vorschläge in unserer Redaktionsplanung.",
  },
  {
    question: "Wie funktionieren Affiliate-Links?",
    answer:
      "Wir verwenden Affiliate-Links, um unsere unabhängige Arbeit zu finanzieren. Diese Links beeinflussen niemals unsere Bewertungen. Wenn du über unsere Links kaufst, zahlst du nicht mehr – unterstützt uns aber.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section className="space-y-10 md:space-y-12">
      <SectionHeading
        kicker="Häufige Fragen"
        title={<>Alles, was du <span className="text-gradient">wissen</span> musst</>}
        description="Antworten auf die wichtigsten Fragen rund um unsere Reviews und Bewertungen."
      />

      <ScrollReveal variant="fade">
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.question}
                className={cn(
                  "overflow-hidden rounded-2xl border transition-all duration-300",
                  isOpen
                    ? "border-primary/30 bg-card shadow-lg shadow-primary/5"
                    : "border-border bg-card/60 hover:border-primary/20"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle
                      className={cn(
                        "size-5 shrink-0 transition-colors duration-300",
                        isOpen ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      )}
                    />
                    <span
                      className={cn(
                        "font-serif text-lg font-semibold tracking-tight transition-colors duration-300",
                        isOpen ? "text-primary" : "group-hover:text-foreground"
                      )}
                    >
                      {faq.question}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                      isOpen
                        ? "rotate-180 border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground group-hover:border-primary/30 group-hover:text-primary"
                    )}
                  >
                    <ChevronDown className="size-4" />
                  </span>
                </button>
                <div
                  id={`faq-panel-${i}`}
                  className="accordion-panel"
                  data-open={isOpen}
                  role="region"
                >
                  <div>
                    <p className="px-6 pb-6 pl-14 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </section>
  );
}
