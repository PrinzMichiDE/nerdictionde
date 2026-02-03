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

export const metadata: Metadata = {
  title: "Spiele Release Kalender | Nerdiction",
  description: "Alle kommenden Spiele-Releases auf einen Blick. Verpasse keine Neuerscheinung!",
};

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
  // Show releases for the entire year (365 days)
  const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
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

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-8 px-4">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Spiele Release Kalender
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mt-2">
              Alle kommenden Spiele-Releases auf einen Blick
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Gamepad2 className="h-4 w-4" />
          <span>{releases.length} kommende Releases für {now.getFullYear()}</span>
        </div>
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
                  <h2 className="text-2xl md:text-3xl font-bold">{monthName}</h2>
                  <Badge variant="secondary" className="text-sm">
                    {monthReleases.length} {monthReleases.length === 1 ? "Release" : "Releases"}
                  </Badge>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {monthReleases.map((release) => (
                    <Link key={release.id} href={`/reviews/${release.slug}`}>
                      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 border-2 hover:border-primary/20 h-full">
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          {release.images?.[0] ? (
                            <Image
                              src={release.images[0]}
                              alt={release.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              unoptimized
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                              <span className="text-muted-foreground text-xs font-medium">Kein Bild</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <ScoreBadge
                            score={release.score}
                            className="absolute bottom-3 right-3 scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg"
                          />
                        </div>
                        <CardHeader className="p-5">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold border-primary/30 bg-primary/5"
                            >
                              {release.releaseDate
                                ? format(new Date(release.releaseDate), "d. MMMM yyyy", { locale: de })
                                : "TBA"}
                            </Badge>
                          </div>
                          <CardTitle className="line-clamp-2 text-lg leading-tight group-hover:text-primary transition-colors">
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
        <div className="text-center py-24 border-2 border-dashed rounded-xl bg-muted/30">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">
            Noch keine kommenden Releases vorhanden
          </p>
          <p className="text-muted-foreground/70 text-sm mt-2">
            Der Release-Kalender wird wöchentlich aktualisiert (jeden Montag).
          </p>
        </div>
      )}
    </div>
  );
}
