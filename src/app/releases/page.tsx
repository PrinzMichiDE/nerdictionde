import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Gamepad2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { generateItemListSchema, getSiteUrl } from "@/lib/seo";
import { ReleaseCalendarAutoSync } from "./components/ReleaseCalendarAutoSync";

export const metadata: Metadata = {
  title: "Spiele Release Kalender",
  description:
    "Alle kommenden Spiele-Releases auf einen Blick. Verpasse keine Neuerscheinung - mit Release-Datum und Plattform.",
  alternates: {
    canonical: "/releases",
  },
  openGraph: {
    type: "website",
    title: "Spiele Release Kalender | Nerdiction",
    description:
      "Alle kommenden Spiele-Releases auf einen Blick. Verpasse keine Neuerscheinung!",
    url: `${getSiteUrl()}/releases`,
    siteName: "Nerdiction",
    locale: "de_DE",
  },
  twitter: {
    card: "summary",
    title: "Spiele Release Kalender | Nerdiction",
    description:
      "Alle kommenden Spiele-Releases auf einen Blick. Verpasse keine Neuerscheinung!",
  },
};

export const dynamic = "force-dynamic";

interface Release {
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  releaseDate: Date | null;
  images: string[];
  score: number;
  metadata: any;
  steamAppId: string | null;
  epicId: string | null;
  gogId: string | null;
}

export default async function ReleasesPage() {
  const now = new Date();
  // Show releases for the next 24 months
  const futureDate = new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000);
  // Also include end of current year
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  const maxDate = futureDate > endOfYear ? futureDate : endOfYear;

  const releases = await prisma.review.findMany({
    where: {
      category: "game",
      releaseDate: {
        gte: now,
        lte: maxDate,
      },
    },
    select: {
      id: true,
      title: true,
      title_en: true,
      slug: true,
      releaseDate: true,
      images: true,
      score: true,
      metadata: true,
      steamAppId: true,
      epicId: true,
      gogId: true,
    },
    orderBy: {
      releaseDate: "asc",
    },
    take: 1000, // Increased limit for full year
  });

  // Group releases by month
  const releasesByMonth: Record<string, Release[]> = {};
  releases.forEach((release) => {
    if (release.releaseDate) {
      const monthKey = release.releaseDate.toISOString().substring(0, 7); // YYYY-MM
      if (!releasesByMonth[monthKey]) {
        releasesByMonth[monthKey] = [];
      }
      releasesByMonth[monthKey].push(release as Release);
    }
  });

  const monthKeys = Object.keys(releasesByMonth).sort();

  const itemListSchema = generateItemListSchema(
    releases.map((release) => ({
      name: release.title,
      url: `${getSiteUrl()}/reviews/${release.slug}`,
      image: release.images?.[0],
    }))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-8 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-md bg-primary/10">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <span className="kicker text-primary">Release-Kalender</span>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mt-1">
              Spiele Release Kalender
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground text-lg md:text-xl">
          Alle kommenden Spiele-Releases auf einen Blick
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Gamepad2 className="h-4 w-4" />
          <span>{releases.length} kommende Releases in den nächsten 24 Monaten</span>
        </div>
        <ReleaseCalendarAutoSync />
      </div>

      {/* Releases by Month */}
      {monthKeys.length > 0 ? (
        <div className="space-y-12">
          {monthKeys.map((monthKey) => {
            const monthReleases = releasesByMonth[monthKey];
            const [year, month] = monthKey.split("-");
            const monthDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
            const monthName = format(monthDate, "MMMM yyyy", { locale: de });

            return (
              <section key={monthKey} className="space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">{monthName}</h2>
                  <Badge variant="secondary" className="text-sm">
                    {monthReleases.length} {monthReleases.length === 1 ? "Release" : "Releases"}
                  </Badge>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {monthReleases.map((release) => (
                    <Link key={release.id} href={`/reviews/${release.slug}`}>
                      <Card className="overflow-hidden border h-full">
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          {release.images?.[0] ? (
                            <Image
                              src={release.images[0]}
                              alt={release.title}
                              fill
                              className="object-cover"
                              unoptimized
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <span className="text-muted-foreground text-xs font-medium">Kein Bild</span>
                            </div>
                          )}
                          <ScoreBadge
                            score={release.score}
                            className="absolute bottom-3 right-3"
                          />
                        </div>
                        <CardHeader className="p-5">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold"
                            >
                              {release.releaseDate
                                ? format(new Date(release.releaseDate), "d. MMMM yyyy", { locale: de })
                                : "TBA"}
                            </Badge>
                          </div>
                          <CardTitle className="font-serif line-clamp-2 text-lg leading-tight">
                            {release.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                          {release.metadata?.platforms && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {release.metadata.platforms.slice(0, 3).map((platform: string) => (
                                <Badge
                                  key={platform}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 h-4"
                                >
                                  {platform}
                                </Badge>
                              ))}
                              {release.metadata.platforms.length > 3 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                  +{release.metadata.platforms.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed rounded-md bg-muted/30">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">
            Noch keine kommenden Releases vorhanden
          </p>
          <p className="text-muted-foreground/70 text-sm mt-2">
            Der Release-Kalender wird täglich automatisch aktualisiert.
          </p>
        </div>
      )}
    </div>
  );
}
