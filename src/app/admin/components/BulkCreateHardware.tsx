"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Cpu, CheckCircle2, XCircle, SkipForward } from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface BulkCreateHardwareResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  reviews: Array<{ id: string; title: string; slug: string }>;
  errors: Array<{ hardware: string; error: string }>;
}

export function BulkCreateHardware() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkCreateHardwareResult | null>(null);

  // Form state
  const [hardwareNames, setHardwareNames] = useState<string>("");
  const [batchSize, setBatchSize] = useState<string>("3");
  const [delay, setDelay] = useState<string>("3000");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [skipExisting, setSkipExisting] = useState(true);

  const handleBulkCreate = async () => {
    // Parse hardware names from textarea (one per line)
    const names = hardwareNames
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (names.length === 0) {
      alert("Bitte gib mindestens einen Hardware-Namen ein.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post("/api/reviews/bulk-create-hardware", {
        hardwareNames: names,
        batchSize: parseInt(batchSize) || 3,
        delayBetweenBatches: parseInt(delay) || 3000,
        status,
        skipExisting,
      });

      setResult(response.data.results);
    } catch (error: any) {
      console.error("Bulk hardware create failed:", error);
      alert("Fehler bei der Massenerstellung: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
              <Cpu className="text-primary h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Massen-Erstellung Hardware</CardTitle>
              <CardDescription>
                Erstelle mehrere Hardware-Reviews gleichzeitig. Gib Hardware-Namen ein (ein Name pro Zeile).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hardware Names Input */}
          <div className="space-y-2">
            <Label htmlFor="hardwareNames">Hardware-Namen (ein Name pro Zeile)</Label>
            <Textarea
              id="hardwareNames"
              placeholder="RTX 4090&#10;Ryzen 9 7950X&#10;PlayStation 5&#10;Logitech G Pro X&#10;Samsung Odyssey G9"
              value={hardwareNames}
              onChange={(e) => setHardwareNames(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {hardwareNames.split("\n").filter((l) => l.trim().length > 0).length} Hardware-Artikel erkannt
            </p>
          </div>

          {/* Processing Options */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Verarbeitungs-Optionen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch-Größe</Label>
                <Input
                  id="batchSize"
                  type="number"
                  placeholder="3"
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  min="1"
                  max="5"
                />
                <p className="text-xs text-muted-foreground">
                  Anzahl der gleichzeitig verarbeiteten Hardware-Artikel (empfohlen: 3)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay">Verzögerung zwischen Batches (ms)</Label>
                <Input
                  id="delay"
                  type="number"
                  placeholder="3000"
                  value={delay}
                  onChange={(e) => setDelay(e.target.value)}
                  min="0"
                  max="10000"
                />
                <p className="text-xs text-muted-foreground">
                  Pause zwischen Batches (empfohlen: 3000ms für Hardware)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="published">Veröffentlicht</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skipExisting">Bereits vorhandene überspringen</Label>
                <Select
                  value={skipExisting ? "true" : "false"}
                  onValueChange={(v) => setSkipExisting(v === "true")}
                >
                  <SelectTrigger id="skipExisting">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ja</SelectItem>
                    <SelectItem value="false">Nein</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Unterstützte Hardware-Typen
            </h4>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">GPU</Badge>
              <Badge variant="outline">CPU</Badge>
              <Badge variant="outline">Monitor</Badge>
              <Badge variant="outline">Keyboard</Badge>
              <Badge variant="outline">Mouse</Badge>
              <Badge variant="outline">Headset</Badge>
              <Badge variant="outline">Controller</Badge>
              <Badge variant="outline">Console</Badge>
              <Badge variant="outline">RAM</Badge>
              <Badge variant="outline">Storage</Badge>
              <Badge variant="outline">Motherboard</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Der Hardware-Typ wird automatisch erkannt. Falls nicht erkannt, wird standardmäßig "GPU" verwendet.
            </p>
          </div>

          <Button
            onClick={handleBulkCreate}
            disabled={loading || !hardwareNames.trim()}
            className="w-full h-12 text-lg font-bold"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Erstelle Hardware-Reviews...
              </>
            ) : (
              <>
                <Cpu className="mr-2 h-5 w-5" />
                Massenerstellung starten
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle>Ergebnisse</CardTitle>
            <CardDescription>Zusammenfassung der Hardware-Massenerstellung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-sm text-muted-foreground">Gesamt</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.successful}</div>
                <div className="text-sm text-muted-foreground">Erfolgreich</div>
              </div>
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-sm text-muted-foreground">Übersprungen</div>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
              </div>
            </div>

            {result.reviews.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Erstellte Reviews ({result.reviews.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                    >
                      <span>{review.title}</span>
                      <Badge variant="outline">{review.slug}</Badge>
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
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-2 bg-red-500/10 rounded text-sm"
                    >
                      <div className="font-medium">{error.hardware}</div>
                      <div className="text-xs text-muted-foreground">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
