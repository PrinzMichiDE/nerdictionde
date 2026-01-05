"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";

interface GenerationResult {
  attempted: number;
  successful: number;
  failed: number;
  updated: number;
  builds: Array<{ pricePoint: number; slug: string; status: string }>;
  message?: string;
}

interface PCBuildGeneratorProps {
  onComplete?: () => void;
}

export function PCBuildGenerator({ onComplete }: PCBuildGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateBuilds = async () => {
    if (!confirm("Möchtest du wirklich alle Gaming PC Builds neu generieren? Dies kann mehrere Minuten dauern.")) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.get("/api/cron/generate-gaming-pc-builds", {
        timeout: 600000, // 10 minutes timeout
      });

      const data = response.data.results || response.data;
      setResult(data);
      
      // Call onComplete callback if generation was successful
      if (data && (data.successful > 0 || data.updated > 0) && onComplete) {
        onComplete();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Fehler beim Generieren der PC Builds";
      setError(errorMessage);
      console.error("PC Build generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = () => {
    return new Date().toLocaleString("de-DE");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Gaming PC Builds Generierung
            </CardTitle>
            <CardDescription className="mt-2">
              Generiert automatisch neue Gaming PC Setups für alle Preiskategorien (300€ - 4.500€).
              Nutzt die offizielle Amazon PA API, Tavily für Hardware-Recherche und OpenAI für Titel/Beschreibungen.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            onClick={generateBuilds}
            disabled={loading}
            className="flex items-center gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wird generiert...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Alle Builds generieren
              </>
            )}
          </Button>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <p>Automatischer Cron-Job: Monatlich am 1. um 02:00 Uhr UTC</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Fehler</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="text-2xl font-bold">{result.attempted}</div>
                <div className="text-sm text-muted-foreground">Versucht</div>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.successful}
                </div>
                <div className="text-sm text-muted-foreground">Erstellt</div>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.updated}
                </div>
                <div className="text-sm text-muted-foreground">Aktualisiert</div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.failed}
                </div>
                <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Zeitpunkt: {formatTimestamp()}</span>
              </div>
            </div>

            {result.message && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium">{result.message}</p>
              </div>
            )}

            {result.builds && result.builds.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Verarbeitete Builds ({result.builds.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.builds.map((build, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/30 border flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{build.pricePoint}€ Build</p>
                          <Badge variant={build.status === "created" ? "default" : "secondary"}>
                            {build.status === "created" ? "Neu" : "Aktualisiert"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{build.slug}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

