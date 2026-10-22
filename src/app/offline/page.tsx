"use client";

import Link from "next/link";
import { WifiOff, Home, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="size-8" />
      </div>
      <h1 className="mb-2 font-serif text-3xl font-semibold">Du bist offline</h1>
      <p className="mb-8 max-w-sm text-muted-foreground">
        Diese Seite ist noch nicht im Cache gespeichert. Sobald du wieder online
        bist, funktioniert alles wie gewohnt. Bereits besuchte Seiten kannst du
        auch ohne Verbindung lesen.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="size-4" />
          Erneut versuchen
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Home className="size-4" />
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
