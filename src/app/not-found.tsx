import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Seite nicht gefunden",
  description: "Die angeforderte Seite wurde nicht gefunden.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16 md:py-24 space-y-6">
      <span className="kicker text-primary">Fehler 404</span>
      <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight">
        Seite nicht gefunden
      </h1>
      <p className="text-muted-foreground text-lg">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button asChild size="lg">
          <Link href="/">Zur Startseite</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/reviews">Alle Reviews</Link>
        </Button>
      </div>
    </div>
  );
}
