"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rss, CheckCircle2, XCircle, RefreshCw, Clock, Settings } from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HardwareRSSResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  reviews: Array<{ id: string; title: string; slug: string }>;
  errors: Array<{ hardware: string; error: string }>;
  skippedItems?: Array<{ hardware: string; reason: string }>;
  duration?: number;
  timestamp?: string;
}

export function HardwareRSSFetcher() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HardwareRSSResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxItems, setMaxItems] = useState(10);
  const [delayMs, setDelayMs] = useState(2000);
  const [showSettings, setShowSettings] = useState(false);

  const fetchHardwareRSS = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(
        "/api/cron/fetch-hardware-rss",
        {
          maxItems: maxItems,
          delayMs: delayMs,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 600000, // 10 minutes timeout for long-running operations
        }
      );

      setResult(response.data.results);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Fehler beim Abrufen der Hardware-Reviews";
      setError(errorMessage);
      console.error("Hardware RSS fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${minutes}m ${secs}s`;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "N/A";
    try {
      return new Date(timestamp).toLocaleString("de-DE");
    } catch {
      return timestamp;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rss className="h-5 w-5" />
              Hardware RSS Feed
            </CardTitle>
            <CardDescription className="mt-2">
              Ruft automatisch Hardware-Reviews vom Spieletester.de RSS-Feed ab.
              Deduplizierung verhindert doppelte Einträge.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            onClick={fetchHardwareRSS}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wird verarbeitet...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Hardware-Reviews abrufen
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Einstellungen
          </Button>
          <div className="text-sm text-muted-foreground">
            <p>Automatischer Cron-Job: Täglich um 02:00 Uhr</p>
          </div>
        </div>

        {showSettings && (
          <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxItems">Max. Items</Label>
                <Input
                  id="maxItems"
                  type="number"
                  min="1"
                  max="50"
                  value={maxItems}
                  onChange={(e) => setMaxItems(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Anzahl der zu verarbeitenden RSS-Items (1-50)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delayMs">Verzögerung (ms)</Label>
                <Input
                  id="delayMs"
                  type="number"
                  min="0"
                  max="10000"
                  step="100"
                  value={delayMs}
                  onChange={(e) => setDelayMs(Math.max(0, Math.min(10000, parseInt(e.target.value) || 2000)))}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Wartezeit zwischen Items (0-10000ms)
                </p>
              </div>
            </div>
          </div>
        )}

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
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-sm text-muted-foreground">Gesamt</div>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.successful}
                </div>
                <div className="text-sm text-muted-foreground">Erfolgreich</div>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {result.skipped}
                </div>
                <div className="text-sm text-muted-foreground">Übersprungen</div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.failed}
                </div>
                <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
              </div>
            </div>

            {/* Metadata */}
            {(result.duration || result.timestamp) && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {result.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Dauer: {formatDuration(result.duration)}</span>
                  </div>
                )}
                {result.timestamp && (
                  <div>
                    <span>Zeitpunkt: {formatTimestamp(result.timestamp)}</span>
                  </div>
                )}
              </div>
            )}

            {result.reviews.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Erstellte Reviews ({result.reviews.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-3 rounded-lg bg-muted/30 border flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{review.title}</p>
                        <p className="text-xs text-muted-foreground">{review.slug}</p>
                      </div>
                      <Badge variant="outline" className="ml-2 shrink-0">
                        Draft
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.skippedItems && result.skippedItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-yellow-600" />
                  Übersprungene Items ({result.skippedItems.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.skippedItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                    >
                      <p className="font-medium text-sm">{item.hardware}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Fehler ({result.errors.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.errors.map((err, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                    >
                      <p className="font-medium text-sm">{err.hardware}</p>
                      <p className="text-xs text-muted-foreground mt-1">{err.error}</p>
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
