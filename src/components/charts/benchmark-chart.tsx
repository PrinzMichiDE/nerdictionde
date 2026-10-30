"use strict";

/**
 * Benchmark-Balken-Chart: Produkt vs. Kategorie-Durchschnitt und Vorgänger
 * SVG, keine externe Dependency.
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface BenchmarkItem {
  label: string;
  value: number;
  max: number;
  unit?: string;
}

interface BenchmarkChartProps {
  productName: string;
  benchmarks: BenchmarkItem[];
  categoryAvg?: number;
  className?: string;
}

const ICONS: Record<string, any> = { Activity, Cpu, Monitor, Smartphone };

export function BenchmarkChart({ productName, benchmarks, categoryAvg, className }: BenchmarkChartProps) {
  if (benchmarks.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Benchmark-Ergebnisse</CardTitle>
          <CardDescription>Keine Benchmark-Daten verfügbar.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const maxVal = Math.max(...benchmarks.map((b) => b.max), 100);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Benchmark-Ergebnisse</CardTitle>
        <CardDescription className="text-xs">
          {productName} im Vergleich zur Kategorie
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-3">
          {benchmarks.map((b, i) => {
            const pct = Math.max(0, Math.min(100, (b.value / b.max) * 100));
            const color = pct >= 75 ? "success" : pct >= 50 ? "warning" : "destructive";
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-medium">{b.value}{b.unit ?? ""}</span>
                </div>
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-700",
                      color === "success" ? "bg-success" : color === "warning" ? "bg-warning" : "bg-destructive",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {categoryAvg !== undefined && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>Kategorie-Ø:</span>
                    <span>{categoryAvg}{b.unit ?? ""}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 py-1">
            0–50: Schwach
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-1">
            50–75: Mittel
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-1">
            75–100: Stark
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}
