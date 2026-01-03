import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Users, TrendingUp, Eye, Mail, FileText, BarChart3, Smartphone, Monitor, Globe, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMediaStats, formatMediaNumber } from "@/lib/mediadaten";

export const metadata: Metadata = {
  title: "Mediadaten | Nerdiction",
  description: "Mediadaten und Werbeinformationen für Werbepartner und Kooperationspartner",
};

export default function MediadatenPage() {
  const stats = getMediaStats();
  
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
          <h1 className="text-4xl font-bold tracking-tight">Mediadaten</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Informationen zu unserer Reichweite und Zielgruppe
        </p>
      </div>

      {/* Important Notice */}
      <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
              <FileText className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                Aktuell keine Werbeflächen verfügbar
              </h3>
              <p className="text-muted-foreground">
                Wir bieten aktuell keine Werbeflächen an. Wir wollen unabhängig bleiben und unsere 
                Nutzer nicht mit Werbung nerven! Unsere Inhalte werden ohne Banner, Pop-ups oder 
                störende Werbeformate präsentiert.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Falls sich dies in Zukunft ändert, werden wir es transparent kommunizieren. 
                Für Kooperationen im Bereich Produkttests und Reviews besuche unsere{" "}
                <Link href="/kooperationen" className="text-primary hover:underline font-medium">
                  Kooperationsseite
                </Link>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Notice */}
      <Card className="border-2 border-primary/20 bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm">
            <RefreshCw className="size-4 text-primary" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Monatliche Aktualisierung:</strong> Alle Daten werden monatlich aktualisiert. 
              Stand: <strong className="text-foreground">{stats.lastUpdated}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Kernmetriken</h2>
          <p className="text-muted-foreground">
            Wichtige Kennzahlen zu unserer Reichweite und Engagement
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monatliche Besucher</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {formatMediaNumber(stats.monthlyVisitors)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aktive Nutzer</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seitenaufrufe</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Eye className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {formatMediaNumber(stats.monthlyPageViews)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pro Monat</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verweildauer</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {stats.averageSessionDuration}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Durchschnittlich</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {stats.bounceRate}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Niedrige Absprungrate</p>
          </CardContent>
        </Card>
        </div>
      </section>

      {/* Additional Metrics */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Detaillierte Metriken</h2>
          <p className="text-muted-foreground">
            Weitere Einblicke in das Nutzerverhalten und die Reichweite
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seiten pro Besuch</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.averagePagesPerVisit}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Durchschnittlich</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Neue Besucher</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.newVisitorsPercentage}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Erstbesucher</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wiederkehrende Besucher</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.returningVisitorsPercentage}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Loyale Leserschaft</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Review-Lesezeit</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.averageReviewReadTime}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Durchschnittlich</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Device & Geography */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Geräte & Geografie</h2>
          <p className="text-muted-foreground">
            Verteilung nach Gerätetyp und geografischer Herkunft
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Smartphone className="size-5 text-primary" />
                </div>
                Mobile Traffic
              </CardTitle>
              <CardDescription>Smartphone & Tablet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                {stats.mobileTrafficPercentage}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-primary rounded-full transition-all" 
                  style={{ width: `${stats.mobileTrafficPercentage}%` }} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Monitor className="size-5 text-primary" />
                </div>
                Desktop Traffic
              </CardTitle>
              <CardDescription>PC & Laptop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                {stats.desktopTrafficPercentage}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-primary rounded-full transition-all" 
                  style={{ width: `${stats.desktopTrafficPercentage}%` }} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="size-5 text-primary" />
                </div>
                Top Land
              </CardTitle>
              <CardDescription>Hauptherkunftsland</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.topCountry}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Primäre Zielgruppe
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Target Audience */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Zielgruppe</h2>
          <p className="text-muted-foreground text-lg">
            Unsere Leserschaft besteht aus technikaffinen Enthusiasten und Gaming-Interessierten
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Demografie</CardTitle>
              <CardDescription>Altersstruktur und Geschlechterverteilung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alter 18-24</span>
                  <span className="font-semibold text-foreground">~35%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "35%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alter 25-34</span>
                  <span className="font-semibold text-foreground">~40%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "40%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alter 35-44</span>
                  <span className="font-semibold text-foreground">~20%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "20%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alter 45+</span>
                  <span className="font-semibold text-foreground">~5%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "5%" }} />
                </div>
              </div>
              <div className="pt-2 mt-2 border-t text-xs text-muted-foreground">
                <p>Geschlechterverteilung: ~75% männlich, ~25% weiblich</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interessen</CardTitle>
              <CardDescription>Hauptinteressensgebiete unserer Leser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-sm">Gaming & Entertainment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-sm">Hardware & Technologie</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-sm">Kaufberatung & Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-sm">Tech-News & Trends</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Advertising Options - Currently Not Available */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Potenzielle Werbeformate</h2>
          <p className="text-muted-foreground text-lg">
            Diese Formate könnten in Zukunft verfügbar sein (aktuell nicht verfügbar)
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-60">
          <Card className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">Display-Werbung</CardTitle>
              <CardDescription>Banner und visuelle Werbeformate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Leaderboard (728x90)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Medium Rectangle (300x250)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Skyscraper (160x600)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Responsive Formate</span>
                </li>
              </ul>
              <div className="pt-2 mt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground">Aktuell nicht verfügbar</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">Sponsored Content</CardTitle>
              <CardDescription>Redaktionell integrierte Inhalte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Sponsored Reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Produktplatzierungen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Native Advertising</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Content Partnerships</span>
                </li>
              </ul>
              <div className="pt-2 mt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground">Aktuell nicht verfügbar</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">Newsletter & E-Mail</CardTitle>
              <CardDescription>Direkter Kontakt zu unserer Community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Newsletter-Sponsoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Dedicated E-Mails</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Product Announcements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Event-Promotion</span>
                </li>
              </ul>
              <div className="pt-2 mt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground">Aktuell nicht verfügbar</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">Video & Podcast</CardTitle>
              <CardDescription>Multimediale Werbeformate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Pre-Roll Videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Mid-Roll Placements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Podcast-Sponsoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Video-Integration</span>
                </li>
              </ul>
              <div className="pt-2 mt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground">Aktuell nicht verfügbar</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">Social Media</CardTitle>
              <CardDescription>Cross-Platform Promotion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Social Media Posts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Story-Placements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Influencer-Kooperationen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Community-Engagement</span>
                </li>
              </ul>
              <div className="pt-2 mt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground">Aktuell nicht verfügbar</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">Events & Kooperationen</CardTitle>
              <CardDescription>Langfristige Partnerschaften</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Event-Sponsoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Produkt-Launches</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Exklusive Kooperationen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Brand Partnerships</span>
                </li>
              </ul>
              <div className="pt-2 mt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground">Aktuell nicht verfügbar</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Content & Editorial */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Content & Redaktion</h2>
          <p className="text-muted-foreground text-lg">
            Hochwertige Inhalte für eine engagierte Leserschaft
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unsere Stärken</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <FileText className="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Professionelle Reviews</h4>
                  <p className="text-sm text-muted-foreground">
                    Detaillierte, unabhängige Tests und Bewertungen von Games und Hardware
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Aktuelle Trends</h4>
                  <p className="text-sm text-muted-foreground">
                    Regelmäßige Updates zu neuesten Entwicklungen und Technologien
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Engagierte Community</h4>
                  <p className="text-sm text-muted-foreground">
                    Aktive Leserschaft mit hohem Engagement und Interaktionsrate
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Datengetriebene Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    Fundierte Analysen basierend auf umfangreichen Tests und Daten
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Contact */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Kontakt</h2>
          <p className="text-muted-foreground text-lg">
            Für Kooperationen im Bereich Produkttests und Reviews
          </p>
        </div>

        <Card className="border-2 hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="size-5 text-primary" />
              </div>
              Kooperationskontakt
            </CardTitle>
            <CardDescription>
              Für Produkttests, Reviews und Kooperationen (keine Werbeanfragen)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">E-Mail:</p>
                <a 
                  href="mailto:kontakt@nerdiction.de" 
                  className="text-primary hover:underline font-medium inline-flex items-center gap-2 group/link"
                >
                  <Mail className="size-4 group-hover/link:scale-110 transition-transform" />
                  kontakt@nerdiction.de
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Für Spiele:</p>
                <a 
                  href="mailto:review@nerdiction.de" 
                  className="text-primary hover:underline font-medium inline-flex items-center gap-2 group/link"
                >
                  <Mail className="size-4 group-hover/link:scale-110 transition-transform" />
                  review@nerdiction.de
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Themen:</p>
                <p className="text-sm text-muted-foreground">
                  Produkttests, Reviews, Kooperationen
                </p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Hinweis:</strong> Wir bieten aktuell keine 
                Werbeflächen an. Für Kooperationsmöglichkeiten im Bereich Produkttests besuche 
                unsere{" "}
                <Link href="/kooperationen" className="text-primary hover:underline font-medium">
                  Kooperationsseite
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Technical Specifications */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Technische Spezifikationen</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Werbematerial-Anforderungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Banner-Formate</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• JPG, PNG, GIF, WebP</li>
                  <li>• Max. Dateigröße: 200 KB</li>
                  <li>• Animationen: HTML5, GIF</li>
                  <li>• Responsive Formate bevorzugt</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Video-Formate</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• MP4, WebM</li>
                  <li>• Max. Dateigröße: 50 MB</li>
                  <li>• Auflösung: 1920x1080</li>
                  <li>• Codec: H.264</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Disclaimer */}
      <section className="pt-8 border-t">
        <p className="text-sm text-muted-foreground italic">
          Alle Angaben sind ohne Gewähr. Die Mediadaten werden regelmäßig aktualisiert und können 
          sich ändern. Für aktuelle Zahlen und individuelle Angebote kontaktieren Sie uns bitte direkt.
        </p>
        <p className="text-sm text-muted-foreground italic mt-2">
          Stand: {new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}
        </p>
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

