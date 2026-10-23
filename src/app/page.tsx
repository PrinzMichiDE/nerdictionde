import prisma from "@/lib/prisma";
import type { Review } from "@/types/review";
import { Hero } from "@/components/home/Hero";
import { EditorialPicks } from "@/components/home/EditorialPicks";
import { HomeReviews } from "@/components/home/HomeReviews";
import { ScoreScale } from "@/components/home/ScoreScale";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import { generateItemListSchema, getSiteUrl } from "@/lib/seo";
import { NewsletterSignup } from "@/components/shared/NewsletterSignup";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Nerdiction - Ehrliche Produkttests" },
  description:
    "Unabhängige Tests zu Games, Filmen, Serien und Hardware. Wir legen jede Wertung offen und testen ohne bezahlte Platzierungen.",
  alternates: {
    canonical: "/",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  game: "Games",
  movie: "Filme",
  series: "Serien",
  hardware: "Hardware",
};

const methodSteps = [
  {
    title: "Auswahl",
    text: "Wir wählen Titel, die für die Community relevant sind, und prüfen die Fakten bei IGDB, TMDB und Steam.",
  },
  {
    title: "Test",
    text: "Mehrere Tage spielen, schauen oder ausprobieren. Performance, Design und Preis-Leistung erfassen wir getrennt.",
  },
  {
    title: "Wertung",
    text: "Aus den Einzelkriterien wird ein Score von 0 bis 100. Dazu kommen Pro und Contra in klaren Sätzen.",
  },
];

export default async function HomePage() {
  const highlightCategories = ["game", "movie", "series", "hardware"];

  let reviews: Review[] = [];
  let total = 0;
  let average = 0;
  const categoryCounts: Record<string, number> = {};

  try {
    const [list, grouped] = await Promise.all([
      prisma.review.findMany({
        where: {
          status: "published",
          category: { in: highlightCategories },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.review.groupBy({
        by: ["category"],
        where: {
          status: "published",
          category: { in: highlightCategories },
        },
        _count: { _all: true },
        _avg: { score: true },
      }),
    ]);

    reviews = list as unknown as Review[];

    let weightedScore = 0;
    for (const row of grouped) {
      const count = row._count._all;
      categoryCounts[row.category] = count;
      total += count;
      weightedScore += (row._avg.score ?? 0) * count;
    }
    average = total > 0 ? weightedScore / total : 0;
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  const formatScore = (value: number) =>
    value.toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const stats =
    total > 0
      ? [
          { label: "Tests", value: String(total) },
          { label: "Ø-Wertung", value: formatScore(average) },
          ...highlightCategories
            .filter((category) => (categoryCounts[category] ?? 0) > 0)
            .map((category) => ({
              label: CATEGORY_LABELS[category] ?? category,
              value: String(categoryCounts[category]),
            })),
        ]
      : [];

  const itemListSchema = generateItemListSchema(
    reviews.map((r) => ({
      name: r.title,
      url: `${getSiteUrl()}/reviews/${r.slug}`,
      image: r.images?.[0],
    }))
  );

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <Hero latest={reviews[0] ?? null} stats={stats} />

      <div className="mt-16 space-y-20 md:mt-20 md:space-y-28">
        {reviews.length > 0 && <EditorialPicks reviews={reviews} />}

        {reviews.length > 0 ? (
          <HomeReviews reviews={reviews} />
        ) : (
          <section className="rounded-sm border border-border bg-card p-10 text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">
              Die ersten Tests sind in Arbeit
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Sobald wir die ersten Titel veröffentlichen, erscheinen sie hier mit
              vollständiger Wertung.
            </p>
            <Button asChild size="lg" className="mt-6 rounded-full">
              <Link href="/reviews">Zu den Reviews</Link>
            </Button>
          </section>
        )}

        <section
          id="so-testen-wir"
          className="grid scroll-mt-24 gap-10 lg:grid-cols-12 lg:gap-12"
        >
          <div className="lg:col-span-5">
            <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
              So testen wir
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Jede Wertung entsteht nach demselben Ablauf. Wir dokumentieren, was wir
              geprüft haben, und nennen die Quellen.
            </p>

            <ol className="mt-8 space-y-6">
              {methodSteps.map((step, index) => (
                <li key={step.title} className="flex gap-4 border-t border-border pt-4">
                  <span className="font-serif text-2xl font-semibold tabular-nums text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-6 text-sm text-muted-foreground">
              Datenquellen: IGDB, TMDB, Steam und Twitch.
            </p>
          </div>

          <div className="lg:col-span-7">
            <ScoreScale reviews={reviews} />
          </div>
        </section>

        <section className="flex flex-col gap-6 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">
              Kein Test verpassen.
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Melde dich für den Nerdiction-Newsletter an. Wir informieren dich,
              sobald ein neuer Test veröffentlicht wird.
            </p>
          </div>
          <NewsletterSignup source="homepage" className="max-w-md" />
        </section>
      </div>
    </div>
  );
}
