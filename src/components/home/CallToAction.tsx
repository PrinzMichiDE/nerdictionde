import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Handshake, ArrowRight, Mail } from "lucide-react";

export function CallToAction() {
  return (
    <section className="space-y-8">
      <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 hover:border-primary transition-all duration-500 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <CardContent className="p-8 md:p-12 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6 text-center md:text-left">
                <div className="inline-flex items-center justify-center md:justify-start p-3 rounded-2xl bg-white/10 border-2 border-white/20 w-fit mx-auto md:mx-0">
                  <Handshake className="h-8 w-8 text-white" />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                    Zusammenarbeit gesucht?
                  </h2>
                  <p className="text-white/90 text-lg leading-relaxed">
                    Du entwickelst Games oder Hardware und suchst nach professionellen Reviews? 
                    Oder du möchtest mit uns kooperieren? Wir freuen uns auf deine Nachricht!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                    className="rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white text-primary hover:bg-white/90"
                  >
                    <Link href="/kooperationen" className="flex items-center gap-2">
                      Mehr erfahren
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all hover:scale-105"
                  >
                    <a href="mailto:kontakt@nerdiction.de" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Kontakt aufnehmen
                    </a>
                  </Button>
                </div>
              </div>

              <div className="space-y-4 text-center md:text-left">
                <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 space-y-2">
                  <h3 className="font-bold text-white text-lg">Was wir bieten:</h3>
                  <ul className="space-y-2 text-white/90 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-0.5">✓</span>
                      <span>Professionelle Produkttests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-0.5">✓</span>
                      <span>Detaillierte Bewertungen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-0.5">✓</span>
                      <span>Reichweite in der Gaming-Community</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-0.5">✓</span>
                      <span>Transparente Zusammenarbeit</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

