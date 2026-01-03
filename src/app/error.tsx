"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service in production
    if (process.env.NODE_ENV === "production") {
      console.error("Application error:", {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      });
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto max-w-md space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Etwas ist schiefgelaufen
          </h1>
          <p className="text-lg text-muted-foreground">
            {process.env.NODE_ENV === "development"
              ? error.message
              : "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/70">
              Fehler-ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="lg" className="rounded-full">
            <RefreshCw className="mr-2 size-4" aria-hidden="true" />
            Erneut versuchen
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/">
              <Home className="mr-2 size-4" aria-hidden="true" />
              Zur Startseite
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
