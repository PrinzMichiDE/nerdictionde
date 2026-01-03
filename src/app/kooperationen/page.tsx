import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Package, CheckCircle2, FileText, Star, Users, TrendingUp, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Kooperationen | Nerdiction",
  description: "Produkttests und Kooperationsmöglichkeiten für Hersteller und Marken",
};

export default function KooperationenPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/" aria-label="Zurück zur Startseite">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight">Kooperationen</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Professionelle Produkttests und Kooperationsmöglichkeiten für Hersteller und Marken
        </p>
      </div>

      {/* Game Review CTA Section */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border-2 border-primary/30">
              <Gamepad2 className="size-7 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl md:text-3xl mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Wir sollen dein Spiel testen?
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Dann sende uns einen Key an{" "}
                <a 
                  href="mailto:review@nerdiction.de" 
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Mail className="size-4" />
                  review@nerdiction.de
                </a>
                {" "}mit allen Infos zu deinem Spiel.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-background/50 rounded-lg p-4 border border-primary/10">
            <p className="text-sm font-semibold text-foreground mb-2">Was wir benötigen:</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <span>Spiel-Key (Steam, Epic Games, GOG, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <span>Spielname und Genre</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <span>Kurze Beschreibung oder Press Kit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <span>Gewünschter Veröffentlichungstermin (falls vorhanden)</span>
              </li>
            </ul>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <a href="mailto:review@nerdiction.de?subject=Spiel-Review-Anfrage">
              <Mail className="size-4 mr-2" />
              Key an review@nerdiction.de senden
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* General Product CTA Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="size-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">Hardware oder andere Produkte?</CardTitle>
              <CardDescription className="text-base">
                Für Hardware-Tests und andere Kooperationen
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-muted-foreground">
            Sende uns eine E-Mail an{" "}
            <a 
              href="mailto:kontakt@nerdiction.de" 
              className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              <Mail className="size-4" />
              kontakt@nerdiction.de
            </a>
          </p>
          <Button asChild size="lg" variant="outline" className="mt-4">
            <a href="mailto:kontakt@nerdiction.de">
              <Mail className="size-4 mr-2" />
              Jetzt Kontakt aufnehmen
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* What We Offer */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Was wir bieten</h2>
          <p className="text-muted-foreground text-lg">
            Professionelle und unabhängige Produkttests für Ihre Hardware und Games
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Star className="size-5 text-primary" />
              </div>
              <CardTitle>Unabhängige Reviews</CardTitle>
              <CardDescription>Ehrliche und fundierte Bewertungen</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Wir testen Ihre Produkte gründlich und geben ehrliche, konstruktive Bewertungen 
                basierend auf objektiven Kriterien und realen Nutzungsszenarien.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <FileText className="size-5 text-primary" />
              </div>
              <CardTitle>Detaillierte Analysen</CardTitle>
              <CardDescription>Umfassende Testberichte</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Unsere Reviews umfassen detaillierte Analysen zu Performance, Design, 
                Benutzerfreundlichkeit und Preis-Leistungs-Verhältnis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Users className="size-5 text-primary" />
              </div>
              <CardTitle>Engagierte Community</CardTitle>
              <CardDescription>Reichweite und Engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ihre Produkte erreichen eine technikaffine Zielgruppe mit hohem 
                Kaufinteresse und Engagement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <TrendingUp className="size-5 text-primary" />
              </div>
              <CardTitle>SEO-Optimiert</CardTitle>
              <CardDescription>Langfristige Sichtbarkeit</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Unsere Reviews sind SEO-optimiert und sorgen für langfristige 
                Sichtbarkeit in Suchmaschinen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Package className="size-5 text-primary" />
              </div>
              <CardTitle>Multimedia-Content</CardTitle>
              <CardDescription>Bilder, Videos und mehr</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Wir erstellen hochwertige Bilder, Screenshots und bei Bedarf auch 
                Video-Content für unsere Reviews.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="size-5 text-primary" />
              </div>
              <CardTitle>Transparente Kommunikation</CardTitle>
              <CardDescription>Klare Absprachen</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Wir kommunizieren transparent über Testzeiträume, Veröffentlichungstermine 
                und alle relevanten Details.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Test Process */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Unser Testprozess</h2>
          <p className="text-muted-foreground text-lg">
            So funktioniert die Zusammenarbeit mit uns
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  1
                </span>
                Kontaktaufnahme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Senden Sie uns eine E-Mail mit Informationen zu Ihrem Produkt, 
                gewünschtem Testzeitraum und Ihren Erwartungen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  2
                </span>
                Absprache & Planung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Wir besprechen die Details, Testkriterien und vereinbaren einen 
                realistischen Zeitplan für den Test und die Veröffentlichung.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  3
                </span>
                Produkttest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Wir testen Ihr Produkt gründlich unter realen Bedingungen und 
                dokumentieren alle relevanten Aspekte mit Screenshots und Notizen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  4
                </span>
                Review-Erstellung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Wir erstellen einen detaillierten, professionellen Review mit 
                Bewertung, Pros & Cons und einer fundierten Empfehlung.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  5
                </span>
                Veröffentlichung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Der Review wird auf unserer Website veröffentlicht und über 
                unsere Kanäle beworben.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  6
                </span>
                Nachbetreuung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Wir stehen für Fragen zur Verfügung und können bei Bedarf 
                Follow-up-Content oder Updates erstellen.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What We Test */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Was wir testen</h2>
          <p className="text-muted-foreground text-lg">
            Unsere Expertise umfasst verschiedene Produktkategorien
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gaming Hardware</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  Grafikkarten & GPUs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  Gaming-Monitore
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  Gaming-Peripherie (Mäuse, Tastaturen, Headsets)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  Gaming-PCs & Komponenten
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  Konsolen & Zubehör
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Games & Software</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  PC-Spiele (alle Genres)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  Konsolenspiele
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  Indie-Games
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  Gaming-Software & Tools
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  VR/AR-Erfahrungen
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Guidelines */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Unsere Richtlinien</h2>
          <p className="text-muted-foreground text-lg">
            Transparenz und Unabhängigkeit sind uns wichtig
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Wichtige Hinweise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Unabhängigkeit</h4>
                  <p className="text-sm text-muted-foreground">
                    Wir behalten uns die redaktionelle Unabhängigkeit vor. Alle Bewertungen 
                    basieren auf unseren objektiven Testkriterien.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Transparenz</h4>
                  <p className="text-sm text-muted-foreground">
                    Kooperationen werden transparent gekennzeichnet. Unsere Leser wissen, 
                    wenn ein Produkt im Rahmen einer Kooperation getestet wurde.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Ehrlichkeit</h4>
                  <p className="text-sm text-muted-foreground">
                    Wir geben ehrliche Bewertungen. Positive wie negative Aspekte werden 
                    fair und konstruktiv dargestellt.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Keine Garantien</h4>
                  <p className="text-sm text-muted-foreground">
                    Wir können keine Garantie für positive Bewertungen geben. Die 
                    Testresultate sind das Ergebnis unserer unabhängigen Prüfung.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Contact CTA */}
      <section className="pt-8 border-t">
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Mail className="size-6 text-primary" />
              Bereit für eine Kooperation?
            </CardTitle>
            <CardDescription className="text-base">
              Kontaktieren Sie uns für weitere Informationen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Senden Sie uns eine E-Mail mit Details zu Ihrem Produkt und Ihren Vorstellungen. 
              Wir melden uns schnellstmöglich bei Ihnen zurück.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="flex-1">
                <a href="mailto:kontakt@nerdiction.de">
                  <Mail className="size-4 mr-2" />
                  kontakt@nerdiction.de
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/mediadaten">
                  Mediadaten ansehen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Back to Home */}
      <div className="pt-8">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="size-4 mr-2" />
            Zurück zur Startseite
          </Link>
        </Button>
      </div>
    </div>
  );
}

