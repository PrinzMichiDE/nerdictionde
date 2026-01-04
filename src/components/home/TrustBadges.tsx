import { Card, CardContent } from "@/components/ui/card";
import { Shield, Award, Users, TrendingUp, CheckCircle2, Zap } from "lucide-react";

interface TrustBadge {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const badges: TrustBadge[] = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: "100% Unabhängig",
    description: "Keine bezahlten Reviews",
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "Professionell",
    description: "Von Experten getestet",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community-Driven",
    description: "Basierend auf eurem Feedback",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Aktuell",
    description: "Immer auf dem neuesten Stand",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Verifiziert",
    description: "Alle Tests dokumentiert",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Schnell",
    description: "Reviews kurz nach Release",
  },
];

export function TrustBadges() {
  return (
    <section className="space-y-8 py-16">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Warum uns vertrauen?
        </h2>
        <p className="text-muted-foreground text-lg">
          Unsere Werte und Prinzipien
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {badges.map((badge, index) => (
          <Card
            key={index}
            className="group relative overflow-hidden border-2 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative z-10 space-y-3">
              <div className="flex justify-center">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  {badge.icon}
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                  {badge.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {badge.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
