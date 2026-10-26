"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, CheckCircle2, XCircle } from "lucide-react";

export function ReleaseSyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    stats?: { totalFound: number; created: number; updated: number; skipped: number; errors: number };
    duration?: string;
  } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/fetch-upcoming-releases");
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      const err = e as Error;
      setResult({ success: false, error: err.message || "Fehler beim Abrufen" });
    } finally {
      setLoading(false);
    }
  };

  const statsEntries = result?.stats
    ? [
        { label: "Gefunden", value: result.stats.totalFound },
        { label: "Neu", value: result.stats.created },
        { label: "Aktualisiert", value: result.stats.updated },
        { label: "Übersprungen", value: result.stats.skipped },
        { label: "Fehler", value: result.stats.errors },
        { label: "Dauer", value: result.duration ?? "" },
      ]
    : null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Release-Kalender</p>
            <p className="text-xs text-muted-foreground">
              Kommende Spiele-Releases aus IGDB abrufen und aktualisieren
            </p>
          </div>
        </div>
        <Button
          onClick={handleSync}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Aktualisiere" : "Jetzt aktualisieren"}
        </Button>
      </div>

      {result && (
        <div className="mt-3 space-y-2">
          {result.success ? (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {result.message}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              {result.error || "Aktualisierung fehlgeschlagen"}
            </p>
          )}
          {statsEntries && (
            <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {statsEntries.map((entry) => (
                <div key={entry.label} className="rounded-md bg-muted/60 px-2.5 py-1.5">
                  <dt className="text-xs text-muted-foreground">{entry.label}</dt>
                  <dd className="text-sm font-medium tabular-nums">{entry.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
