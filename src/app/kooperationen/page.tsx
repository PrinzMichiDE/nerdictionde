import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Package, CheckCircle2, FileText, Star, Users, TrendingUp, Gamepad2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateBreadcrumbSchema, getSiteUrl, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: `Kooperationen | ${SITE_NAME}`,
  },
  description: "Unabhängige Produkttests für Hersteller & Marken. Games, Hardware & mehr - professionell, transparent und redaktionell unabhängig.",
  alternates: {
    canonical: "/kooperationen",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "de_DE",
    url: `${getSiteUrl()}/kooperationen`,
    title: `Kooperationen | ${SITE_NAME}`,
    description: "Unabhängige Produkttests für Hersteller & Marken. Professionelle Reviews für Games, Hardware & mehr.",
    images: [
      {
        url: `${getSiteUrl()}/icon-512.png`,
        width: 512,
        height: 512,
        alt: `${SITE_NAME} - Kooperationen`,
      },
    ],
  },
};

export default function KooperationenPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Startseite", url: `${getSiteUrl()}/` },
    { name: "Kooperationen", url: `${getSiteUrl()}/kooperationen` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="magazine-bg" aria-hidden="true" />

      <div className="max-w-6xl mx-auto pb-16">
        {/* Header */}
        <header className="mb-10 md:mb-14">
          <nav aria-label="Brotkrumen-Navigation" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Startseite
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground/80">Kooperationen</li>
            </ol>
          </nav>

          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
              Kooperationen
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Unabhängige, professionelle Produkttests für Hersteller und Marken. Ehrlich, transparent und mit maximaler Reichweite.
            </p>
          </div>
        </header>

        {/* Game Review CTA */}
        <section className="mb-12">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Gamepad2 className="size-7 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="font-serif text-2xl md:text-3xl mb-2">
                    Wir sollen dein Spiel testen?
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Sende uns deinen Spiel-Key für einen unabhängigen Test.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/40 rounded-lg p-5 border border-border/60">
                <p className="text-sm font-semibold text-foreground mb-3">Was wir benötigen:</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                    <span>Spiel-Key (Steam, Epic Games, GOG, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                    <span>Spielname und Genre</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                    <span>Kurze Beschreibung oder Press Kit</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                    <span>Gewünschter Veröffentlichungstermin</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <a href="mailto:review@nerdiction.de?subject=Spiel-Review-Anfrage">
                    <Mail className="size-4 mr-2" />
                    Key an review@nerdiction.de senden
                    <ArrowRight className="size-4 ml-2 transition-transform motion-reduce:transition-none group-hover:translate-x-0.5" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* General Contact */}
        <section className="mb-14">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">Hardware oder andere Produkte?</CardTitle>
                  <CardDescription className="text-base">
                    Für Hardware-Tests und sonstige Kooperationsanfragen
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Sende uns eine E-Mail an{" "}
                <a href="mailto:kontakt@nerdiction.de" className="text-primary font-semibold hover:underline">
                  kontakt@nerdiction.de
                </a>
              </p>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <a href="mailto:kontakt@nerdiction.de">
                  <Mail className="size-4 mr-2" />
                  Jetzt Kontakt aufnehmen
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* What We Offer */}
        <section className="mb-14">
          <div className="mb-8">
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mt-2">
              Was wir bieten
            </h2>
            <p className="text-muted-foreground text-lg mt-2 max-w-2xl">
              Professionelle und unabhängige Produkttests mit maximaler Reichweite
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="h-full">
              <CardHeader>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Star className="size-5 text-primary" />
                </div>
                <CardTitle>Unabhängige Reviews</CardTitle>
                <CardDescription>Ehrliche und fundierte Bewertungen</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Wir testen gründlich und geben ehrliche, konstruktive Bewertungen basierend auf objektiven Kriterien und realen Nutzungsszenarien.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <FileText className="size-5 text-primary" />
                </div>
                <CardTitle>Detaillierte Analysen</CardTitle>
                <CardDescription>Umfassende Testberichte</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unsere Reviews umfassen detaillierte Analysen zu Performance, Design, Benutzerfreundlichkeit und Preis-Leistungs-Verhältnis.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Users className="size-5 text-primary" />
                </div>
                <CardTitle>Engagierte Community</CardTitle>
                <CardDescription>Reichweite und Engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ihre Produkte erreichen eine technikaffine Zielgruppe mit hohem Kaufinteresse und starker Interaktion.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <TrendingUp className="size-5 text-primary" />
                </div>
                <CardTitle>SEO-Optimiert</CardTitle>
                <CardDescription>Langfristige Sichtbarkeit</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unsere Reviews sind SEO-optimiert und sorgen für langfristige Sichtbarkeit in Suchmaschinen und AI-Antwortmaschinen.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Package className="size-5 text-primary" />
                </div>
                <CardTitle>Multimedia-Content</CardTitle>
                <CardDescription>Bilder, Videos und mehr</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Wir erstellen hochwertige Bilder, Screenshots und bei Bedarf auch Video-Content für unsere Reviews.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
                <CardTitle>Transparente Kommunikation</CardTitle>
                <CardDescription>Klare Absprachen</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Wir kommunizieren transparent über Testzeiträume, Veröffentlichungstermine und alle relevanten Details.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Process */}
        <section className="mb-14">
          <div className="mb-8">
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mt-2">
              Unser Testprozess
            </h2>
            <p className="text-muted-foreground text-lg mt-2">
              So funktioniert die Zusammenarbeit
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { step: "1", title: "Kontaktaufnahme", desc: "Senden Sie uns eine E-Mail mit Informationen zu Ihrem Produkt." },
              { step: "2", title: "Absprache & Planung", desc: "Wir besprechen Details, Testkriterien und vereinbaren einen Zeitplan." },
              { step: "3", title: "Produkttest", desc: "Gründlicher Test unter realen Bedingungen mit ausführlicher Dokumentation." },
              { step: "4", title: "Review-Erstellung", desc: "Detaillierter, professioneller Review mit Bewertung und Pro & Contra." },
              { step: "5", title: "Veröffentlichung", desc: "Review wird auf unserer Website veröffentlicht." },
              { step: "6", title: "Nachbetreuung", desc: "Wir stehen für Fragen zur Verfügung und bieten bei Bedarf Follow-up." },
            ].map((item) => (
              <Card key={item.step} className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <span className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                      {item.step}
                    </span>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Guidelines */}
        <section className="mb-14">
          <div className="mb-8">
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mt-2">
              Unsere Richtlinien
            </h2>
            <p className="text-muted-foreground text-lg mt-2">
              Transparenz und Unabhängigkeit sind unsere obersten Prinzipien
            </p>
          </div>

          <Card>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Unabhängigkeit</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Wir behalten uns die redaktionelle Unabhängigkeit vor. Alle Bewertungen basieren auf objektiven Testkriterien.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Transparenz</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Kooperationen werden transparent gekennzeichnet. Unsere Leser wissen, wenn ein Produkt im Rahmen einer Kooperation getestet wurde.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Ehrlichkeit</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Wir geben ehrliche Bewertungen. Positive wie negative Aspekte werden fair und konstruktiv dargestellt.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Keine Garantien</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Wir können keine Garantie für positive Bewertungen geben. Die Testresultate sind das Ergebnis unserer unabhängigen Prüfung.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="mb-10">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/30">
            <CardContent className="p-8 md:p-10 text-center">
              <Mail className="size-10 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-3">
                Bereit für eine Kooperation?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Senden Sie uns eine E-Mail mit Details zu Ihrem Produkt und Ihren Vorstellungen. Wir melden uns schnellstmöglich bei Ihnen zurück.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="rounded-full">
                  <a href="mailto:kontakt@nerdiction.de">
                    <Mail className="size-4 mr-2" />
                    kontakt@nerdiction.de
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link href="/mediadaten">
                    Mediadaten ansehen
                    <ArrowRight className="size-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="pt-6">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="size-4 mr-2" />
              Zurück zur Startseite
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
