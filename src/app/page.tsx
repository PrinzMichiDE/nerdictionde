import prisma from "@/lib/prisma";
import type { Review } from "@/types/review";
import { Hero } from "@/components/home/Hero";
import { EditorialPicks } from "@/components/home/EditorialPicks";
import { HomeReviews } from "@/components/home/HomeReviews";
import { HomeSubscribedCategoryChips } from "@/components/home/HomeSubscribedCategoryChips";
import { ScoreScale } from "@/components/home/ScoreScale";

import { ScrollReveal } from "@/components/home/ScrollReveal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import {
  generateItemListSchema,
  generateWebPageSchema,
  getSiteUrl,
  SITE_NAME,
} from "@/lib/seo";
import { NewsletterSignup } from "@/components/shared/NewsletterSignup";
import { RecommendationsSection } from "@/components/recommendations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} - Ehrliche Produkttests für Games, Filme, Serien & Hardware`,
  },
  description:
    "Unabhängige Tests zu Games, Filmen, Serien und Hardware. Wir legen jede Wertung offen und testen ohne bezahlte Platzierungen. Nerdiction – dein redaktionelles Magazin für fundierte Kaufentscheidungen.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "de_DE",
    url: getSiteUrl(),
    title: `${SITE_NAME} - Ehrliche Produkttests für Games, Filme, Serien & Hardware`,
    description:
      "Unabhängige Tests zu Games, Filmen, Serien und Hardware. Wir legen jede Wertung offen und testen ohne bezahlte Platzierungen.",
    images: [
      {
        url: `${getSiteUrl()}/icon-512.png`,
        width: 512,
        height: 512,
        alt: `${SITE_NAME} - Magazin für unabhängige Produkttests`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nerdiction_de",
    title: `${SITE_NAME} - Ehrliche Produkttests`,
    description:
      "Unabhängige Tests zu Games, Filmen, Serien und Hardware. Wir legen jede Wertung offen und testen ohne bezahlte Platzierungen.",
    images: [`${getSiteUrl()}/icon-512.png`],
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

  const webPageSchema = generateWebPageSchema({
    title: `${SITE_NAME} - Ehrliche Produkttests für Games, Filme, Serien & Hardware`,
    description:
      "Unabhängige Tests zu Games, Filmen, Serien und Hardware. Wir legen jede Wertung offen und testen ohne bezahlte Platzierungen.",
    url: `${getSiteUrl()}/`,
    isPartOf: {
      "@id": `${getSiteUrl()}#website`,
    },
  });

  return (
    <>
      <div className="magazine-bg" aria-hidden="true" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      <ScrollReveal variant="up">
        <Hero latest={reviews[0] ?? null} stats={stats} />
      </ScrollReveal>

      <HomeSubscribedCategoryChips />

      <RecommendationsSection limit={10} />

      <div className="mt-16 space-y-20 md:mt-20 md:space-y-28">
        {reviews.length > 0 && (
          <ScrollReveal variant="up" delay={80}>
            <EditorialPicks reviews={reviews} />
          </ScrollReveal>
        )}

        {reviews.length > 0 ? (
          <ScrollReveal variant="up" delay={120}>
            <HomeReviews reviews={reviews} />
          </ScrollReveal>
        ) : (
          <ScrollReveal variant="fade" delay={120}>
            <section className="rounded-lg border border-border bg-card p-10 text-center">
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
          </ScrollReveal>
        )}

        <ScrollReveal variant="up" delay={160} id="so-testen-wir">
          <section className="magazine-methodology magazine-section" aria-labelledby="method-title">
            <header className="magazine-section-header">
              <span className="magazine-kicker">Methode</span>
              <h2 id="method-title" className="magazine-section-title">So testen wir</h2>
            </header>

            <div className="magazine-method-steps" role="list" aria-label="Testmethode Schritte">
              {methodSteps.map((step, index) => (
                <article key={step.title} className="magazine-method-step" role="listitem">
                  <span className="magazine-method-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="magazine-method-content">
                    <h3 className="magazine-method-title">{step.title}</h3>
                    <p className="magazine-method-desc">{step.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <p className="magazine-sources">
              Datenquellen: IGDB, TMDB, Steam und Twitch.
            </p>

            <div className="magazine-score-distribution">
              <ScoreScale reviews={reviews} />
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal variant="up" delay={200}>
          <section className="magazine-newsletter magazine-section" aria-labelledby="newsletter-title">
            <h2 id="newsletter-title" className="magazine-newsletter-title">
              Kein Test verpassen.
            </h2>
            <p className="magazine-newsletter-desc">
              Melde dich für den Nerdiction-Newsletter an. Wir informieren dich,
              sobald ein neuer Test veröffentlicht wird.
            </p>
            <div className="magazine-newsletter-form">
              <NewsletterSignup source="homepage" className="w-full" />
            </div>
          </section>
        </ScrollReveal>
      </div>
    </>
  );
}
