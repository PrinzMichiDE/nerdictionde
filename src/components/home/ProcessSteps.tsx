import { Search, Gauge, Medal, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { ScrollReveal } from "./ScrollReveal";

interface Step {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
  chip: string;
  tint: string;
}

const steps: Step[] = [
  {
    icon: Search,
    number: "01",
    title: "Recherche & Auswahl",
    description:
      "Wir wählen Titel nach Relevanz für die Community aus und verifizieren Fakten über IGDB, TMDB und Steam.",
    chip: "Auswahl & Quellen",
    tint: "oklch(0.6 0.22 310)",
  },
  {
    icon: Gauge,
    number: "02",
    title: "Praxis-Test & Messwerte",
    description:
      "Intensives Spielen bzw. Anschauen über mehrere Tage – Performance, Design und Preis-Leistung einzeln erfasst.",
    chip: "1–2 Wochen Testphase",
    tint: "oklch(0.65 0.13 185)",
  },
  {
    icon: Medal,
    number: "03",
    title: "Score & Fazit",
    description:
      "Aus allen Kriterien entsteht ein nachvollziehbarer 100-Punkte-Score – mit klaren Pros und Contras.",
    chip: "100-Punkte-System",
    tint: "oklch(0.6 0.16 45)",
  },
];

export function ProcessSteps() {
  return (
    <section className="relative space-y-10 md:space-y-12">
      <SectionHeading
        kicker="Unsere Testmethode"
        title={
          <>
            So testen wir bei <span className="text-gradient">Nerdiction</span>
          </>
        }
        description="Jede Bewertung folgt einem klaren Prozess – vom ersten Eindruck bis zum finalen Score."
      />

      <div className="relative grid gap-6 lg:grid-cols-3">
        {/* Verbindungslinie */}
        <div
          className="absolute inset-x-24 top-[4.75rem] hidden lg:block"
          aria-hidden="true"
        >
          <div className="h-px w-full bg-[repeating-linear-gradient(90deg,var(--border)_0px,var(--border)_10px,transparent_10px,transparent_18px)]" />
        </div>

        {steps.map(({ icon: Icon, number, title, description, chip, tint }, i) => (
          <ScrollReveal key={number} variant="up" delay={i * 140} className="h-full">
            <article className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-2xl hover:shadow-primary/10">
              {/* Ghost-Nummer */}
              <span
                className="pointer-events-none absolute -top-3 right-4 font-serif text-7xl font-semibold tracking-tight"
                aria-hidden="true"
                style={{ color: `color-mix(in oklab, ${tint} 12%, transparent)` }}
              >
                {number}
              </span>

              <div
                className="absolute -bottom-16 -right-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-25"
                style={{ background: tint }}
                aria-hidden="true"
              />

              <div className="relative z-10 flex h-full flex-col gap-5">
                <span
                  className="relative inline-flex size-14 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                  style={{
                    background: `color-mix(in oklab, ${tint} 12%, transparent)`,
                    borderColor: `color-mix(in oklab, ${tint} 32%, transparent)`,
                    color: tint,
                  }}
                >
                  <Icon className="size-6" />
                  <span
                    className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-60"
                    style={{
                      boxShadow: `0 0 0 4px color-mix(in oklab, ${tint} 16%, transparent)`,
                    }}
                    aria-hidden="true"
                  />
                </span>

                <div className="space-y-2.5">
                  <h3 className="font-serif text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>

                <span className="mt-auto inline-flex w-fit items-center rounded-full border border-border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {chip}
                </span>
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
