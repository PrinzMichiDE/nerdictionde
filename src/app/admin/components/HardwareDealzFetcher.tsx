"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, CheckCircle2, AlertCircle, ExternalLink, Sparkles } from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrapedPCBuild } from "@/lib/hardwaredealz-scraper";

interface HardwareDealzFetcherProps {
  onComplete?: () => void;
}

export function HardwareDealzFetcher({ onComplete }: HardwareDealzFetcherProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedPCBuild[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [useAI, setUseAI] = useState(true);
  const [category, setCategory] = useState<"desktop" | "laptop">("desktop");

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setScrapedData(null);
    setResult(null);

    try {
      const response = await axios.get(`/api/admin/import-hardwaredealz?category=${category}`);
      setScrapedData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Fehler beim Laden von HardwareDealz");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!scrapedData) return;
    
    setImporting(true);
    setError(null);

    try {
      const response = await axios.post("/api/admin/import-hardwaredealz", {
        builds: scrapedData,
        useAI,
      });
      setResult(response.data);
      setScrapedData(null);
      if (onComplete) onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Fehler beim Importieren");
    } finally {
      setImporting(false);
    }
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val as "desktop" | "laptop");
    setScrapedData(null);
    setResult(null);
    setError(null);
  };

  const originalUrl = category === "desktop" 
    ? "https://www.hardwaredealz.com/die-besten-gaming-desktop-pcs" 
    : "https://www.hardwaredealz.com/die-besten-gaming-laptops-und-notebooks";

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Download className="h-5 w-5" />
              Nerdiction Empfehlungen Import
            </CardTitle>
            <CardDescription className="mt-2">
              Importiert die aktuellsten Gaming PC & Laptop Setups von hardwaredealz.com. 
              Dies überschreibt bestehende Komponenten für die entsprechenden Preiskategorien.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              Original öffnen
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-6">
          <Tabs value={category} onValueChange={handleCategoryChange} className="w-auto">
            <TabsList>
              <TabsTrigger value="desktop">Gaming PCs</TabsTrigger>
              <TabsTrigger value="laptop">Gaming Laptops</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleScrape}
              disabled={loading || importing}
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Daten abrufen
            </Button>

            {scrapedData && (
              <Button
                onClick={handleImport}
                disabled={importing}
                variant="default"
                className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {scrapedData.length} Builds importieren
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-background/50 p-2 rounded-lg border border-primary/10">
            <Switch 
              id="use-ai" 
              checked={useAI} 
              onCheckedChange={setUseAI} 
              disabled={loading || importing}
            />
            <Label htmlFor="use-ai" className="flex items-center gap-1.5 cursor-pointer text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
              KI-Texte generieren
            </Label>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Fehler</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-600">Erfolg</p>
              <p className="text-sm text-green-600/80">{result.message}</p>
            </div>
          </div>
        )}

        {scrapedData && (
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">
              Gefundene Builds
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto pr-2">
              {scrapedData.map((build, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-lg">{build.pricePoint}€</p>
                    <Badge variant="outline">{build.components.length} Teile</Badge>
                  </div>
                  <p className="text-xs font-bold line-clamp-1">{build.title}</p>
                  <ul className="text-[10px] text-muted-foreground space-y-1">
                    {build.components.slice(0, 3).map((c, i) => (
                      <li key={i} className="truncate">• {c.name}</li>
                    ))}
                    {build.components.length > 3 && <li className="italic">... und {build.components.length - 3} weitere</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

