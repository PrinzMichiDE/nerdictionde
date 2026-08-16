import { type CSSProperties } from "react";
import { Gamepad2, Film, Tv, Cpu, Wrench, Newspaper, Trophy, Rocket, Users, Zap } from "lucide-react";

const items = [
  { icon: Gamepad2, label: "Games" },
  { icon: Film, label: "Filme" },
  { icon: Tv, label: "Serien" },
  { icon: Cpu, label: "Hardware" },
  { icon: Wrench, label: "Kaufberatung" },
  { icon: Newspaper, label: "News" },
  { icon: Trophy, label: "Top 10" },
  { icon: Rocket, label: "Releases" },
  { icon: Users, label: "Community" },
  { icon: Zap, label: "Schnell getestet" },
];

function MarqueeRow() {
  return (
    <>
      {items.map(({ icon: Icon, label }, i) => (
        <span
          key={`${label}-${i}`}
          className="inline-flex items-center gap-3 px-6 font-serif text-lg md:text-xl font-medium text-muted-foreground whitespace-nowrap transition-colors hover:text-foreground"
        >
          <Icon className="size-4 text-primary" />
          {label}
          <span className="ml-6 text-primary/50" aria-hidden="true">
            ✦
          </span>
        </span>
      ))}
    </>
  );
}

export function Marquee() {
  return (
    <div className="full-bleed border-y border-border bg-background/80 py-5 backdrop-blur-sm">
      <div className="marquee" style={{ "--marquee-speed": "38s" } as CSSProperties}>
        <div className="marquee-track">
          <MarqueeRow />
          <MarqueeRow />
        </div>
      </div>
    </div>
  );
}
