import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Gamepad2, Monitor, Film, Tv, HelpCircle, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateBreadcrumbSchema, getSiteUrl, SITE_NAME } from "@/lib/seo";
import prisma from "@/lib/prisma";
import { GuideSyncTrigger } from "@/components/guides/GuideSyncTrigger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: `Guides & Wiki | ${SITE_NAME}`,
  },
  description: "Umfassende Guides, Tutorials und Wiki-Einträge zu Gaming, Hardware, Technik und mehr. Tipps, Tricks und Kaufberatungen für die Community.",
  alternates: {
    canonical: "/community/guides",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "de_DE",
    url: `${getSiteUrl()}/community/guides`,
    title: `Guides & Wiki | ${SITE_NAME}`,
    description: "Umfassende Guides, Tutorials und Wiki-Einträge zu Gaming, Hardware, Technik und mehr.",
    images: [
      {
        url: `${getSiteUrl()}/icon-512.png`,
        width: 512,
        height: 512,
        alt: `${SITE_NAME} - Guides & Wiki`,
      },
    ],
  },
};

const guideCategories = [
  {
    title: "Gaming Guides",
    description: "Tipps, Builds, Walkthroughs und Strategien für deine Lieblingsspiele",
    icon: Gamepad2,
    href: "/community/guides/gaming",
    color: "var(--chart-3)",
  },
  {
    title: "Hardware Guides",
    description: "PC-Builds, Kaufberatung, Overclocking und Troubleshooting",
    icon: Monitor,
    href: "/community/guides/hardware",
    color: "var(--chart-1)",
  },
  {
    title: "Film & Serie",
    description: "Empfehlungen, Watchlists und Hintergrundwissen zu Filmen und Serien",
    icon: Film,
    href: "/community/guides/film-serie",
    color: "var(--chart-2)",
  },
  {
    title: "Streaming & Content",
    description: "Tips für Streamer, Content-Erstellung und OBS-Einstellungen",
    icon: Tv,
    href: "/community/guides/streaming",
    color: "var(--chart-5)",
  },
];

const popularGuides = [
  {
    title: "Gaming-PC kaufen 2025: Der ultimative Guide",
    category: "Hardware Guides",
    description: "So findest du den perfekten Gaming-PC für dein Budget",
    href: "/community/guides/hardware/gaming-pc-kaufen-2025",
  },
  {
    title: "Steam Deck Tipps & Tricks",
    category: "Gaming Guides",
    description: "Das Beste aus deinem Steam Deck herausholen",
    href: "/community/guides/gaming/steam-deck-tipps-tricks",
  },
  {
    title: "Monitor kaufen: IPS, OLED oder Mini-LED?",
    category: "Hardware Guides",
    description: "Welcher Display-Typ passt zu dir?",
    href: "/community/guides/hardware/monitor-kaufen",
  },
];

export default function GuidesPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Startseite", url: `${getSiteUrl()}/` },
    { name: "Community", url: `${getSiteUrl()}/forum` },
    { name: "Guides & Wiki", url: `${getSiteUrl()}/community/guides` },
  ]);

  return (
    <>
      <GuideSyncTrigger />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="magazine-bg" aria-hidden="true" />

      <div className="max-w-6xl mx-auto pb-16">
        <header className="mb-10 md:mb-14">
          <nav aria-label="Brotkrumen-Navigation" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Startseite
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/forum" className="hover:text-primary transition-colors">
                  Community
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground/80">Guides & Wiki</li>
            </ol>
          </nav>

          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
              Guides & Wiki
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Umfassende Anleitungen, Tutorials und Wissensdatenbank für Gaming, Hardware und mehr. Von Einsteigern für die Community.
            </p>
          </div>
        </header>

        <section className="mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Guides durchsuchen..."
              className="w-full h-12 rounded-lg border border-border bg-card pl-12 pr-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-1">Suche wird in Kürze verfügbar sein</p>
        </section>

        <section className="mb-14">
          <div className="mb-8">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
              Kategorien
            </h2>
            <p className="text-muted-foreground mt-2">
              Finde Guides nach Thema
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {guideCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.title} href={category.href}>
                  <Card className="h-full transition-colors hover:border-primary/40 hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in oklab, ${category.color} 15%, transparent)` }}>
                          <Icon className="size-6" style={{ color: category.color }} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">{category.title}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                        <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mb-14">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
                Beliebte Guides
              </h2>
              <p className="text-muted-foreground mt-2">
                Die meistgelesenen Anleitungen der Community
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {popularGuides.length > 0 ? (
              popularGuides.map((guide) => (
                <Link key={guide.id} href={`/community/guides/${guide.slug}`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-primary">
                            {guide.category === "gaming" ? "Gaming Guides" : guide.category === "hardware" ? "Hardware Guides" : guide.category === "film-serie" ? "Film & Serie" : "Streaming & Content"}
                          </span>
                          <h3 className="font-serif text-lg font-semibold mt-1 mb-2 group-hover:text-primary transition-colors">
                            {guide.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {guide.excerpt}
                          </p>
                        </div>
                        <ArrowRight className="size-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Guides vorhanden. Führe den Sync aus.
              </div>
            )}
          </div>
        </section>

        <section>
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/30">
            <CardContent className="p-8 md:p-10 text-center">
              <BookOpen className="size-10 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-3">
                Eigenen Guide schreiben?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Teile dein Wissen mit der Community. Wir freuen uns über neue Guides und Tutorials.
              </p>
              <Button asChild size="lg" className="rounded-full">
                <Link href="/forum">
                  <HelpCircle className="size-4 mr-2" />
                  Im Forum besprechen
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
