import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto max-w-md space-y-6">
        {/* 404 Number */}
        <div className="space-y-2">
          <h1 className="text-8xl font-bold tracking-tight text-primary/20 sm:text-9xl">
            404
          </h1>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Seite nicht gefunden
          </h2>
        </div>

        {/* Description */}
        <p className="text-lg text-muted-foreground">
          Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/">
              <Home className="mr-2 size-4" aria-hidden="true" />
              Zur Startseite
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/reviews">
              <Search className="mr-2 size-4" aria-hidden="true" />
              Reviews durchsuchen
            </Link>
          </Button>
        </div>

        {/* Back Button */}
        <div className="pt-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-sm"
          >
            <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
            Zurück
          </Button>
        </div>
      </div>
    </div>
  );
}
