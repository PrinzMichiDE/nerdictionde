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
    } catch (e: any) {
      setResult({ success: false, error: e.message || "Fehler beim Abrufen" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Release-Kalender</p>
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
          {loading ? "Aktualisiere..." : "Jetzt aktualisieren"}
        </Button>
      </div>

      {result && (
        <div className="text-xs space-y-1">
          {result.success ? (
            <p className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {result.message}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-red-600">
              <XCircle className="h-3.5 w-3.5" />
              {result.error || "Aktualisierung fehlgeschlagen"}
            </p>
          )}
          {result.stats && (
            <p className="text-muted-foreground">
              Gefunden: {result.stats.totalFound} · Neu: {result.stats.created} ·
              Aktualisiert: {result.stats.updated} · Übersprungen: {result.stats.skipped} ·
              Fehler: {result.stats.errors} · Dauer: {result.duration}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
