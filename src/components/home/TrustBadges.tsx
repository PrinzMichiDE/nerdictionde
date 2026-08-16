import { ShieldCheck, Users, Timer, BadgeCheck, type LucideIcon } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

interface TrustItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const items: TrustItem[] = [
  {
    icon: ShieldCheck,
    title: "Keine bezahlten Reviews",
    description: "Unabhängig & objektiv getestet",
  },
  {
    icon: BadgeCheck,
    title: "Transparente Scores",
    description: "Nachvollziehbares 100-Punkte-System",
  },
  {
    icon: Users,
    title: "Community-getrieben",
    description: "Dein Feedback fließt in jeden Test",
  },
  {
    icon: Timer,
    title: "Schnell beim Release",
    description: "Reviews kurz nach dem Launch",
  },
];

export function TrustBadges() {
  return (
    <div className="full-bleed border-y border-border bg-card/60">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 lg:px-8 xl:px-12">
        {items.map(({ icon: Icon, title, description }, i) => (
          <ScrollReveal
            key={title}
            variant="up"
            delay={i * 100}
            className={i > 0 && i % 2 === 1 ? "sm:border-l sm:border-border sm:pl-6 lg:border-l-0 lg:pl-0" : ""}
          >
            <div className="flex items-center gap-4 lg:justify-center lg:text-center lg:flex-col lg:gap-3">
              <span className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold tracking-tight">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
