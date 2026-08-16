import Link from "next/link";
import { Gamepad2, Film, Tv, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { ScrollReveal } from "./ScrollReveal";
import { SpotlightCard } from "./SpotlightCard";

interface CategoryCounts {
  game: number;
  movie: number;
  series: number;
}

interface CategoriesShowcaseProps {
  counts: CategoryCounts;
}

const categories = [
  {
    key: "game" as const,
    href: "/reviews?category=game",
    name: "Games",
    description: "Umfassende Tests zu den neuesten Spielen – von AAA bis Indie.",
    icon: Gamepad2,
    glow: "oklch(0.62 0.15 210)",
  },
  {
    key: "movie" as const,
    href: "/reviews?category=movie",
    name: "Filme",
    description: "Professionelle Kritiken zu Kinohits, Blockbustern und Streaming-Titeln.",
    icon: Film,
    glow: "oklch(0.6 0.16 30)",
  },
  {
    key: "series" as const,
    href: "/reviews?category=series",
    name: "Serien",
    description: "Detaillierte Serien-Analysen – Staffel für Staffel, ehrlich bewertet.",
    icon: Tv,
    glow: "oklch(0.62 0.15 150)",
  },
];

export function CategoriesShowcase({ counts }: CategoriesShowcaseProps) {
  return (
    <section className="space-y-10 md:space-y-12">
      <SectionHeading
        kicker="Kategorien"
        title={<>Finde deinen <span className="text-gradient">Bereich</span></>}
        description="Von Games über Filme bis Serien – stöbere durch unsere Reviews nach Kategorie."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          const count = counts[cat.key];
          return (
            <ScrollReveal key={cat.key} variant="up" delay={i * 130} className="h-full">
              <SpotlightCard tilt={false} className="h-full rounded-3xl">
                <Link
                  href={cat.href}
                  className="group shine relative flex h-full flex-col justify-between gap-10 overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
                >
                {/* Glow */}
                <div
                  className="absolute -top-16 -right-16 size-44 rounded-full blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-40"
                  style={{ background: cat.glow }}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top_right,#000_10%,transparent_65%)]"
                  aria-hidden="true"
                />

                <div className="relative z-10 flex items-start justify-between">
                  <span
                    className="inline-flex size-16 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `color-mix(in oklab, ${cat.glow} 18%, transparent)`,
                      borderColor: `color-mix(in oklab, ${cat.glow} 35%, transparent)`,
                      color: cat.glow,
                    }}
                  >
                    <Icon className="size-8" />
                  </span>
                  <ArrowUpRight className="size-6 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>

                <div className="relative z-10 space-y-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-serif text-3xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                      {cat.name}
                    </h3>
                    {count > 0 && (
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                        {count} Tests
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Jetzt stöbern
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </div>
                </Link>
              </SpotlightCard>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
