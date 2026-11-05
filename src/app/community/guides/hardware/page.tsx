import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Monitor, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { generateBreadcrumbSchema, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: `Hardware Guides | Nerdiction`,
  },
  description: "PC-Builds, Kaufberatung, Komponenten und Troubleshooting.",
  alternates: {
    canonical: "/community/guides/hardware",
  },
};

export default function HardwareGuidesPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Startseite", url: `${getSiteUrl()}/` },
    { name: "Community", url: `${getSiteUrl()}/forum` },
    { name: "Guides & Wiki", url: `${getSiteUrl()}/community/guides` },
    { name: "Hardware Guides", url: `${getSiteUrl()}/community/guides/hardware` },
  ]);

  const guides = [
    { title: "Gaming-PC kaufen 2025: Der ultimative Guide", description: "So findest du den perfekten Gaming-PC für dein Budget", href: "#" },
    { title: "Monitor kaufen: IPS, OLED oder Mini-LED?", description: "Welcher Display-Typ passt zu dir?", href: "#" },
    { title: "Grafikkarte kaufen: AMD vs NVIDIA 2025", description: "Aktueller Vergleich für jeden Geldbeutel", href: "#" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="magazine-bg" aria-hidden="true" />
      <div className="max-w-6xl mx-auto pb-16">
        <header className="mb-10">
          <nav aria-label="Brotkrumen-Navigation" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Startseite</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/community/guides" className="hover:text-primary">Guides & Wiki</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground/80">Hardware Guides</li>
            </ol>
          </nav>
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-chart-1/15 flex items-center justify-center">
              <Monitor className="size-6 text-chart-1" />
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">Hardware Guides</h1>
              <p className="text-muted-foreground mt-1">PC-Builds, Kaufberatung & Troubleshooting</p>
            </div>
          </div>
          <Link href="/community/guides" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Zurück zu allen Guides
          </Link>
        </header>
        <div className="grid gap-4">
          {guides.map((guide) => (
            <Card key={guide.title} className="transition-colors hover:border-primary/40">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-serif text-lg font-semibold mb-2">{guide.title}</h2>
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                  </div>
                  <ArrowRight className="size-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">Weitere Guides werden in Kürze hinzugefügt.</p>
        </div>
      </div>
    </>
  );
}
