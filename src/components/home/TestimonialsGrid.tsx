import { Quote, Star } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { ScrollReveal } from "./ScrollReveal";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  tint: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Die Reviews auf Nerdiction haben mir bei meiner letzten Hardware-Entscheidung enorm geholfen. Endlich mal ehrliche und detaillierte Tests.",
    name: "Max Mustermann",
    role: "Gaming-Enthusiast",
    initials: "MM",
    tint: "oklch(0.62 0.15 160)",
  },
  {
    quote:
      "Als Einsteigerin finde ich die Reviews super verständlich. Die Bewertungskriterien sind klar und nachvollziehbar. Top!",
    name: "Sarah Schmidt",
    role: "Casual Gamer",
    initials: "SS",
    tint: "var(--primary)",
  },
  {
    quote:
      "Professionelle Tests mit echten Benchmarks und praxisnahen Erfahrungen. Genau das, was ich gesucht habe!",
    name: "Tom Weber",
    role: "Hardware-Sammler",
    initials: "TW",
    tint: "oklch(0.6 0.15 260)",
  },
];

export function TestimonialsGrid() {
  return (
    <section className="space-y-10 md:space-y-12">
      <SectionHeading
        kicker="Community-Feedback"
        title={<>Was unsere <span className="text-gradient">Leser</span> sagen</>}
        description="Echte Meinungen von echten Nutzern – das treibt unsere Redaktion an."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <ScrollReveal key={t.name} variant="up" delay={i * 130} className="h-full">
            <figure className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-border bg-card p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10">
              <div
                className="absolute -top-14 -right-14 size-36 rounded-full blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-25"
                style={{ background: t.tint }}
                aria-hidden="true"
              />
              <Quote
                className="size-8"
                style={{ color: t.tint }}
                fill="currentColor"
                aria-hidden="true"
              />
              <div className="flex gap-1" aria-label="5 von 5 Sternen">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="flex-1 text-muted-foreground leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t border-border pt-4">
                <span
                  className="inline-flex size-11 items-center justify-center rounded-full font-serif text-sm font-bold text-white shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${t.tint}, color-mix(in oklab, ${t.tint} 60%, black))`,
                  }}
                >
                  {t.initials}
                </span>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
