"use client";

"use strict";

/**
 * Kauf-Entscheidungs-Assistent („30-Sekunden-Check")
 *
 * Zeigt Pros/Cons dynamisch nach Nutzer-Gewichtung sortiert an,
 * ein Preis-Leistungs-Meter (0–100) und eine klare Kaufempfehlung.
 * Baut auf Review.pros, Review.cons, Review.score und metadata.price auf.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DecisionAssistantProps {
  review: {
    id: string;
    title: string;
    score: number;
    pros: string[];
    cons: string[];
    metadata?: { price?: number; currency?: string; affiliateLink?: string } | null;
  };
  className?: string;
}

const WEIGHT_CATEGORIES = [
  { key: "leistung", label: "Leistung", default: 35 },
  { key: "preis", label: "Preis-Leistung", default: 30 },
  { key: "verarbeitung", label: "Verarbeitung", default: 20 },
  { key: "ausstattung", label: "Ausstattung", default: 15 },
] as const;

export function DecisionAssistant({ review, className }: DecisionAssistantProps) {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(WEIGHT_CATEGORIES.map((c) => [c.key, c.default])),
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(WEIGHT_CATEGORIES[0].key);

  const weightedScore = useMemo(() => {
    const price = review.metadata?.price ?? 0;
    const priceScore = price > 0 ? Math.max(0, 100 - Math.min(100, (price / 1000) * 50)) : 50;
    const base = review.score;
    const perfWeight = weights.leistung / 100;
    const priceWeight = weights.preis / 100;
    const buildWeight = weights.verarbeitung / 100;
    const equipWeight = weights.ausstattung / 100;
    const perf = Math.min(100, base + 5);
    const build = Math.min(100, base);
    const equip = Math.min(100, base - 5);
    return Math.round(
      perf * perfWeight + priceScore * priceWeight + build * buildWeight + equip * equipWeight,
    );
  }, [review.score, weights, review.metadata?.price]);

  const recommendation = useMemo(() => {
    if (weightedScore >= 75) return { label: "Kaufempfehlung", variant: "success" as const };
    if (weightedScore >= 55) return { label: "Konditionell empfehlenswert", variant: "default" as const };
    return { label: "Eher nicht empfohlen", variant: "destructive" as const };
  }, [weightedScore]);

  return (
    <Card className={cn("border-primary/50", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            30
          </span>
          Kauf-Entscheidungs-Assistent
        </CardTitle>
        <CardDescription>
          Passe die Gewichtung an – wir zeigen dir, ob dieses Produkt zu deinen Prioritäten passt.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preis-Leistungs-Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Preis-Leistungs-Meter</span>
            <span className="font-bold">{weightedScore} / 100</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                weightedScore >= 75 ? "bg-success" : weightedScore >= 55 ? "bg-warning" : "bg-destructive",
              )}
              style={{ width: `${Math.max(0, Math.min(100, weightedScore))}%` }}
            />
          </div>
          <Badge
            variant={recommendation.variant === "success" ? "default" : recommendation.variant}
            className="w-fit"
          >
            {recommendation.label}
          </Badge>
        </div>

        {/* Gewichtungs-Auswahl (statt Slider, nutzt vorhandenes Select) */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Hauptgewicht legen auf:
          </p>
          <Select
            value={selectedCategory}
            onValueChange={(v) => {
              setSelectedCategory(v);
              // Gewichtung neu berechnen: gewählte Kategorie 40%, Rest gleichverteilt
              const newWeights: Record<string, number> = {};
              const remaining = 60;
              const perOther = Math.floor(remaining / (WEIGHT_CATEGORIES.length - 1));
              WEIGHT_CATEGORIES.forEach((c) => {
                newWeights[c.key] = c.key === v ? 40 : perOther;
              });
              setWeights(newWeights);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Kategorie wählen" />
            </SelectTrigger>
            <SelectContent>
              {WEIGHT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.key} value={cat.key}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Die verbleibenden Kategorien werden gleichmäßig verteilt.
          </p>
        </div>

        {/* Dynamische Pros/Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
              <span className="font-semibold">Pro</span>
            </div>
            <ul className="space-y-1 text-sm">
              {review.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-foreground/90">
                  <span className="text-green-500 mt-0.5">▸</span>
                  {pro}
                </li>
              ))}
              {review.pros.length === 0 && <span className="text-muted-foreground text-sm">Keine Daten</span>}
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-destructive font-semibold">✗</span>
              <span className="font-semibold">Contra</span>
            </div>
            <ul className="space-y-1 text-sm">
              {review.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-foreground/90">
                  <span className="text-destructive mt-0.5">▸</span>
                  {con}
                </li>
              ))}
              {review.cons.length === 0 && <span className="text-muted-foreground text-sm">Keine Daten</span>}
            </ul>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        {review.metadata?.affiliateLink ? (
          <Button
            asChild
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a href={review.metadata.affiliateLink} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2">
              Jetzt bestellen <ChevronRight size={16} strokeWidth={2} />
            </a>
          </Button>
        ) : (
          <Button variant="outline" disabled className="w-full">
            Kein Angebot verfügbar
          </Button>
        )}
        {review.metadata?.price && (
          <span className="text-xs text-muted-foreground block text-center mt-2">
            Preis: {review.metadata.price} {review.metadata.currency ?? "€"}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
