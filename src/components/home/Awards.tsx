import { Card, CardContent } from "@/components/ui/card";
import { Award, Trophy, Star, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

interface AwardItem {
  icon: ReactNode;
  title: string;
  description: string;
  year?: string;
}

const awards: AwardItem[] = [
  {
    icon: <Trophy className="h-8 w-8" />,
    title: "Top Review Site 2024",
    description: "Ausgezeichnet für herausragende Qualität",
    year: "2024",
  },
  {
    icon: <Star className="h-8 w-8" />,
    title: "Community Choice",
    description: "Von der Community am meisten geschätzt",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Wachstums-Champion",
    description: "Schnellstes Wachstum in der Branche",
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Exzellenz in Tests",
    description: "Höchste Standards in der Bewertung",
  },
];

export function Awards() {
  return (
    <section className="space-y-8 py-16 border-y border-border">
      <div className="border-b border-border pb-4">
        <span className="kicker text-primary">Auszeichnungen</span>
        <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mt-1">
          Anerkennung & Erfolge
        </h2>
        <p className="text-muted-foreground mt-2">
          Unsere Errungenschaften und Auszeichnungen
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {awards.map((award, index) => (
          <Card key={index} className="overflow-hidden border border-border bg-card">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-md bg-muted text-muted-foreground">
                  {award.icon}
                </div>
              </div>
              <div className="space-y-2">
                {award.year && (
                  <p className="kicker text-muted-foreground">{award.year}</p>
                )}
                <h3 className="font-serif text-lg font-semibold tracking-tight">
                  {award.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {award.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
