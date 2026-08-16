import { ShieldCheck, Gauge, Users, Award, TrendingUp, ListChecks, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { ScrollReveal } from "./ScrollReveal";
import { SpotlightCard } from "./SpotlightCard";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  tint: string;
}

const features: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Unabhängig & objektiv",
    description: "Keine bezahlten Reviews, keine versteckten Interessen. Nur ehrliche Tests.",
    tint: "oklch(0.62 0.15 160)",
  },
  {
    icon: Gauge,
    title: "Transparente Scores",
    description: "Ein nachvollziehbares 100-Punkte-System, das du jederzeit prüfen kannst.",
    tint: "var(--primary)",
  },
  {
    icon: Users,
    title: "Community-driven",
    description: "Dein Feedback fließt direkt in unsere Tests und künftige Reviews ein.",
    tint: "oklch(0.6 0.15 260)",
  },
  {
    icon: Award,
    title: "Praxisnahe Tests",
    description: "Wir testen, wie du spielst und arbeitest – nicht nur in der Theorie.",
    tint: "oklch(0.62 0.16 45)",
  },
  {
    icon: TrendingUp,
    title: "Immer aktuell",
    description: "Neue Releases werden schnell und zuverlässig unter die Lupe genommen.",
    tint: "oklch(0.62 0.14 190)",
  },
  {
    icon: ListChecks,
    title: "Klare Kriterien",
    description: "Performance, Design, Preis-Leistung – alles einzeln und fair bewertet.",
    tint: "oklch(0.62 0.15 310)",
  },
];

export function FeatureGrid() {
  return (
    <section className="space-y-10 md:space-y-12">
      <SectionHeading
        kicker="Warum Nerdiction?"
        title={<>Reviews, denen du <span className="text-gradient">vertrauen</span> kannst</>}
        description="Unser Anspruch: faire, fundierte und verständliche Bewertungen für alle Nerds da draußen."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description, tint }, i) => (
          <ScrollReveal key={title} variant="up" delay={(i % 3) * 120} className="h-full">
            <SpotlightCard tilt={false} className="h-full rounded-2xl">
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10">
                {/* Obere Akzentlinie */}
                <div
                  className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, ${tint}, transparent)` }}
                  aria-hidden="true"
                />
                <div
                  className="absolute -bottom-16 -right-16 size-40 rounded-full blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-25"
                  style={{ background: tint }}
                  aria-hidden="true"
                />

                <div className="relative z-10 space-y-4">
                  <span
                    className="inline-flex size-12 items-center justify-center rounded-xl border transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                    style={{
                      background: `color-mix(in oklab, ${tint} 14%, transparent)`,
                      borderColor: `color-mix(in oklab, ${tint} 30%, transparent)`,
                      color: tint,
                    }}
                  >
                    <Icon className="size-6" />
                  </span>
                  <h3 className="font-serif text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            </SpotlightCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
