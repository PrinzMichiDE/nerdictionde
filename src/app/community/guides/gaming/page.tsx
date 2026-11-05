import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { generateBreadcrumbSchema, getSiteUrl, SITE_NAME } from "@/lib/seo";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: {
    absolute: `Gaming Guides | ${SITE_NAME}`,
  },
  description: "Gaming Guides, Tipps, Tricks und Walkthroughs für PC und Konsolen.",
  alternates: {
    canonical: "/community/guides/gaming",
  },
};

export const dynamic = "force-dynamic";

export default async function GamingGuidesPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Startseite", url: `${getSiteUrl()}/` },
    { name: "Community", url: `${getSiteUrl()}/forum` },
    { name: "Guides & Wiki", url: `${getSiteUrl()}/community/guides` },
    { name: "Gaming Guides", url: `${getSiteUrl()}/community/guides/gaming` },
  ]);

  const guides = await prisma.guide.findMany({
    where: { type: "guide", category: "gaming", status: "published" },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="magazine-bg" aria-hidden="true" />

      <div className="max-w-6xl mx-auto pb-16">
        <header className="mb-10">
          <nav aria-label="Brotkrumen-Navigation" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Startseite</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/community/guides" className="hover:text-primary">Guides & Wiki</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground/80">Gaming Guides</li>
            </ol>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-chart-3/15 flex items-center justify-center">
              <Gamepad2 className="size-6 text-chart-3" />
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
                Gaming Guides
              </h1>
              <p className="text-muted-foreground mt-1">
                Tipps, Tricks, Walkthroughs und Strategien
              </p>
            </div>
          </div>

          <Link href="/community/guides" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Zurück zu allen Guides
          </Link>
        </header>

        <div className="grid gap-4">
          {guides.map((guide) => (
            <Link key={guide.id} href={`/community/guides/${guide.slug}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="font-serif text-lg font-semibold mb-2">{guide.title}</h2>
                      <p className="text-sm text-muted-foreground">{guide.excerpt || ""}</p>
                    </div>
                    <ArrowRight className="size-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {guides.length === 0 && (
          <div className="mt-8 text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">Noch keine Gaming-Guides vorhanden.</p>
          </div>
        )}
      </div>
    </>
  );
}
