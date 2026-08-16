import { ShieldCheck } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { ScrollReveal } from "./ScrollReveal";
import { cn } from "@/lib/utils";

interface DataSource {
  wordmark: string;
  name: string;
  description: string;
  usage: string;
  tint: string;
}

const sources: DataSource[] = [
  {
    wordmark: "IGDB",
    name: "IGDB",
    description:
      "Offizielle Spieldaten für Fakten, Genres und Community-Wertungen – als Grundlage unserer Game-Reviews.",
    usage: "Spiele",
    tint: "oklch(0.6 0.22 310)",
  },
  {
    wordmark: "TMDB",
    name: "TMDB",
    description:
      "Film- & Serien-Metadaten mit Crew, Genres, Plakaten und Veröffentlichungsdaten für fundierte Tests.",
    usage: "Filme & Serien",
    tint: "oklch(0.65 0.13 185)",
  },
  {
    wordmark: "Steam",
    name: "Steam",
    description:
      "Store- und Community-Daten für die getesteten Titel – vom Release-Preis bis zu Player-Wertungen.",
    usage: "Spiele",
    tint: "oklch(0.6 0.16 245)",
  },
  {
    wordmark: "Twitch",
    name: "Twitch",
    description:
      "Community-Login und Live-Kontext – wir schauen dahin, wo gespielt und diskutiert wird.",
    usage: "Community",
    tint: "oklch(0.55 0.25 295)",
  },
];

export function DataSources() {
  return (
    <section className="space-y-10 md:space-y-12">
      <SectionHeading
        kicker="Daten & Integrationen"
        title={
          <>
            Fakten aus <span className="text-gradient">verlässlichen Quellen</span>
          </>
        }
        description="Unsere Recherche stützt sich auf etablierte Plattformen – damit Bewertungen auf belastbaren Daten beruhen."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sources.map(({ wordmark, name, description, usage, tint }, i) => (
          <ScrollReveal key={name} variant="up" delay={(i % 4) * 110} className="h-full">
            <article
              className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl"
              style={{ ["--src-tint" as string]: tint }}
            >
              <div
                className="absolute -top-14 -right-14 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-30"
                style={{ background: tint }}
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-5">
                <div
                  className="inline-flex h-12 items-center rounded-xl border px-3.5 font-sans text-sm font-extrabold tracking-tight transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105"
                  style={{
                    background: `color-mix(in oklab, ${tint} 12%, transparent)`,
                    borderColor: `color-mix(in oklab, ${tint} 30%, transparent)`,
                    color: tint,
                  }}
                >
                  {wordmark}
                </div>

                <h3 className="font-serif text-xl font-semibold tracking-tight">{name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

                <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {usage}
                </span>
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal variant="fade" delay={120}>
        <p
          className={cn(
            "mx-auto flex max-w-xl items-center justify-center gap-2.5 text-center",
            "text-sm text-muted-foreground"
          )}
        >
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          Keine bezahlten Platzierungen – alle Datenquellen dienen ausschließlich der Recherche.
        </p>
      </ScrollReveal>
    </section>
  );
}
