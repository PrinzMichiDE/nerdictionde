import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Shield, Zap, Users, Award, TrendingUp } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Unabhängig & Objektiv",
    description: "Unsere Reviews sind vollständig unabhängig und basieren auf ehrlichen Tests ohne externe Einflüsse.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Aktuell & Relevant",
    description: "Wir testen die neuesten Games und Hardware-Produkte, damit du immer informiert bleibst.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community-Driven",
    description: "Deine Meinung zählt! Wir hören auf Feedback und integrieren Community-Wünsche in unsere Reviews.",
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "Professionelle Bewertungen",
    description: "Detaillierte Analysen mit klaren Bewertungskriterien für fundierte Kaufentscheidungen.",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Transparente Scores",
    description: "Nachvollziehbare Bewertungssysteme, die dir zeigen, warum ein Produkt unsere Wertung erhalten hat.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Praxisnah & Verständlich",
    description: "Reviews, die nicht nur technische Details liefern, sondern auch für Einsteiger verständlich sind.",
  },
];

export function WhyNerdiction() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Warum Nerdiction?</h2>
        <p className="text-muted-foreground text-lg">
          Was uns auszeichnet und warum du uns vertrauen kannst
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="group relative overflow-hidden border-2 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative z-10 space-y-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                {feature.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

