"use strict";

/**
 * Preis-Entwicklungs-Chart (Linien-Chart, SVG, keine externe Dependency)
 * Zeigt die Preise der letzten 90 Tage mit Tiefstpreis-Markierung.
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricePoint {
  date: string;
  price: number;
}

interface PriceHistoryChartProps {
  prices: PricePoint[];
  currentPrice?: number;
  currency?: string;
  className?: string;
}

export function PriceHistoryChart({ prices, currentPrice, currency = "EUR", className }: PriceHistoryChartProps) {
  const sorted = [...prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (sorted.length < 2) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Preisentwicklung</CardTitle>
          <CardDescription>Nicht genug Daten für ein Preis-Chart.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pricesOnly = sorted.map((p) => p.price);
  const minPrice = Math.min(...pricesOnly);
  const maxPrice = Math.max(...pricesOnly);
  const minIndex = pricesOnly.indexOf(minPrice);
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const change = ((latest.price - first.price) / first.price) * 100;
  const isLowest = latest.price === minPrice;

  // SVG-Dimensions
  const width = 340;
  const height = 140;
  const padding = { top: 20, right: 20, bottom: 24, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Skalierung
  const xScale = (i: number) => padding.left + (i / (sorted.length - 1)) * chartWidth;
  const yScale = (val: number) => {
    const range = maxPrice - minPrice || 1;
    return padding.top + chartHeight - ((val - minPrice) / range) * chartHeight;
  };

  // Pfad-Daten
  const path = sorted
    .map((_, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(sorted[i].price)}`)
    .join(" ");

  // Tiefstpreis-Punkt
  const minPoint = `M ${xScale(minIndex)} ${yScale(minPrice)} L ${xScale(minIndex)} ${height - padding.bottom + 6}`;

  return (
    <Card className={className}>
      <CardHeader className="pb-3 flex items-center justify-between">
        <div>
          <CardTitle className="text-sm">Preisentwicklung (90 Tage)</CardTitle>
          <CardDescription className="text-xs">
            {sorted.length} Preis-Erhebungen
          </CardDescription>
        </div>
        <Badge variant="default" className="text-xs">
          {isLowest ? "Jetzt Tiefstpreis" : change >= 0 ? "Preis gestiegen" : "Preis gefallen"}
        </Badge>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex items-end justify-between w-full h-64 px-2">
          {/* Y-Achse Labels */}
          <div className="w-16 text-right text-xs text-muted-foreground flex flex-col justify-between h-full">
            <span>{maxPrice.toFixed(0)} {currency}</span>
            <span>{((maxPrice + minPrice) / 2).toFixed(0)} {currency}</span>
            <span>{minPrice.toFixed(0)} {currency}</span>
          </div>

          {/* Chart */}
          <svg width={width} height={height} className="w-full h-full">
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Bereich unter der Linie */}
            <path
              d={`${path} L ${xScale(sorted.length - 1)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
              fill="url(#priceGradient)"
            />

            {/* Linie */}
            <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Tiefstpreis-Markierung */}
            {isLowest && (
              <>
                <path d={minPoint} stroke="hsl(var(--success))" strokeWidth="1" strokeDasharray="4" />
                <circle cx={xScale(minIndex)} cy={yScale(minPrice)} r={4} fill="hsl(var(--success))" stroke="white" strokeWidth="2" />
              </>
            )}

            {/* Punkte */}
            {sorted.map((_, i) => (
              <circle
                key={i}
                cx={xScale(i)}
                cy={yScale(sorted[i].price)}
                r={3}
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth={1.5}
              />
            ))}
          </svg>

          {/* X-Achse Labels */}
          <div className="flex justify-between w-full mt-2 px-2 text-xs text-muted-foreground">
            <span>{new Date(first.date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
            <span>{new Date(sorted[Math.floor(sorted.length / 2)].date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
            <span>{new Date(latest.date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <DollarSign size={14} strokeWidth={1.5} />
          <span className="text-sm font-medium">{latest.price.toFixed(2)} {currency}</span>
        </div>
        <div className={cn("flex items-center gap-1 text-sm font-medium", change >= 0 ? "text-destructive" : "text-success")}>
          {change >= 0 ? <TrendingUp size={14} strokeWidth={1.5} /> : <TrendingDown size={14} strokeWidth={1.5} />}
          <span>{Math.abs(change).toFixed(1)}% seit {new Date(first.date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
        </div>
        {isLowest && (
          <Badge variant="default" className="text-xs px-2 py-1">
            Günstigster Verlauf
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
