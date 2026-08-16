import { Check, X, Sparkles } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { ScrollReveal } from "./ScrollReveal";
import { cn } from "@/lib/utils";

interface Criterion {
  label: string;
  others: string;
  nerdiction: string;
}

const criteria: Criterion[] = [
  {
    label: "Unabhängigkeit",
    others: "Teilweise bezahlte Platzierungen",
    nerdiction: "100 % unabhängig – keine gekauften Reviews",
  },
  {
    label: "Bewertung",
    others: "Undurchsichtige Skalen",
    nerdiction: "Nachvollziehbares 100-Punkte-System",
  },
  {
    label: "Messwerte",
    others: "Subjektives Bauchgefühl",
    nerdiction: "Dokumentierte Praxis-Tests & Messwerte",
  },
  {
    label: "Testdauer",
    others: "Stunden statt Tage",
    nerdiction: "Tage bis Wochen intensive Testphase",
  },
  {
    label: "Community",
    others: "Kaum Einfluss auf Tests",
    nerdiction: "Dein Feedback fließt direkt ein",
  },
  {
    label: "Finanzierung",
    others: "Intransparente Affiliate-Links",
    nerdiction: "Affiliate offen gekennzeichnet",
  },
];

export function ComparisonTable() {
  return (
    <section className="space-y-10 md:space-y-12">
      <SectionHeading
        kicker="Im Vergleich"
        title={
          <>
            Nerdiction <span className="text-gradient">vs.</span> den Rest
          </>
        }
        description="Was uns von typischen Review-Seiten unterscheidet – auf einen Blick."
      />

      <ScrollReveal variant="up">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-[26%] px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Kriterium
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Typische Review-Seite
                  </th>
                  <th className="relative bg-primary/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary">
                    <span className="absolute inset-y-0 left-0 w-[3px] bg-primary" aria-hidden="true" />
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      Nerdiction
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((criterion, i) => (
                  <tr
                    key={criterion.label}
                    className={cn(
                      "border-b border-border transition-colors hover:bg-muted/40",
                      i === criteria.length - 1 && "border-b-0"
                    )}
                  >
                    <td className="px-6 py-5 font-serif text-base font-semibold tracking-tight">
                      {criterion.label}
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <X className="size-4 shrink-0 text-muted-foreground/60" />
                        {criterion.others}
                      </span>
                    </td>
                    <td className="bg-primary/5 px-6 py-5">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <Check className="size-3.5" />
                        </span>
                        {criterion.nerdiction}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
