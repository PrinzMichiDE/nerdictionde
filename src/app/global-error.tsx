"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="de">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div className="mx-auto max-w-md space-y-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Kritischer Fehler
            </h1>
            <p className="text-lg text-muted-foreground">
              Die Anwendung konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.
            </p>
            <button
              onClick={reset}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
