import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Handshake, ArrowRight, Mail } from "lucide-react";

export function CallToAction() {
  return (
    <section className="space-y-8">
      <Card className="overflow-hidden border border-border bg-card">
        <CardContent className="p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <span className="kicker text-primary flex items-center gap-2">
                  <Handshake className="h-4 w-4" />
                  Zusammenarbeit
                </span>

                <div className="space-y-3">
                  <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
                    Zusammenarbeit gesucht?
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Du entwickelst Games oder Hardware und suchst nach professionellen Reviews?
                    Oder du möchtest mit uns kooperieren? Wir freuen uns auf deine Nachricht!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button asChild size="lg">
                    <Link href="/kooperationen" className="flex items-center gap-2">
                      Mehr erfahren
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <a href="mailto:kontakt@nerdiction.de" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Kontakt aufnehmen
                    </a>
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-md bg-muted space-y-2">
                <h3 className="font-serif text-lg font-semibold tracking-tight">
                  Was wir bieten:
                </h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Professionelle Produkttests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Detaillierte Bewertungen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Reichweite in der Gaming-Community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Transparente Zusammenarbeit</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
