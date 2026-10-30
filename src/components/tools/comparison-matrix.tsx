"use strict";

/**
 * KI-Vergleichs-Matrix: 2–5 Produkte nebeneinander vergleichen.
 *
 * Zeilen = technische Spezifikationen, Spalten = Produkte.
 * Zellen farbkodiert (grün = gut, gelb = mittel, rot = schlecht) anhand
 * von Benchmark-Indizes aus der hardware-db. Sieger-Spalte pro Kategorie.
 * Export als PNG/PDF und shareable Link vorbereitet.
 */

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { CPU_DB, GPU_DB } from "@/lib/hardware-db";

interface ComparisonProduct {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  price?: number;
  currency?: string;
  score?: number;
  specs?: Record<string, string | number | boolean | undefined>;
  images?: string[];
  affiliateLink?: string;
}

interface ComparisonMatrixProps {
  products: ComparisonProduct[];
  className?: string;
}

const SPEC_ROWS = [
  { key: "cpu", label: "Prozessor (CPU)", type: "benchmark" },
  { key: "gpu", label: "Grafikkarte (GPU)", type: "benchmark" },
  { key: "ram", label: "Arbeitsspeicher", type: "text" },
  { key: "speicher", label: "Speicher (SSD/HDD)", type: "text" },
  { key: "preis", label: "Preis", type: "price" },
  { key: "releaseDate", label: "Erscheinung", type: "text" },
] as const;

function benchmarkValue(specs: Record<string, unknown>, key: string): number | null {
  const val = specs[key];
  if (!val) return null;
  const str = String(val);

  if (key === "cpu") {
    const match = CPU_DB.find((c) => c.name.toLowerCase().includes(str.toLowerCase()));
    return match ? match.benchmarkIndex : null;
  }
  if (key === "gpu") {
    const match = GPU_DB.find((g) => g.name.toLowerCase().includes(str.toLowerCase()));
    return match ? match.benchmarkIndex : null;
  }
  return null;
}

function cellColor(type: string, value: unknown, index: number, all: unknown[]): string {
  if (type === "price") {
    const num = Number(value);
    if (!num) return "bg-secondary";
    const nums = all.filter((v) => Number(v) > 0) as number[];
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    if (num === min) return "bg-success/20 text-success";
    if (num === max) return "bg-destructive/20 text-destructive";
    return "bg-warning/20 text-warning";
  }
  if (type === "benchmark") {
    const num = value as number | null;
    if (!num) return "bg-secondary";
    const nums = all.filter((v) => typeof v === "number" && v > 0) as number[];
    if (nums.length === 0) return "bg-secondary";
    const max = Math.max(...nums);
    const pct = num / max;
    if (pct >= 0.8) return "bg-success/20 text-success";
    if (pct >= 0.5) return "bg-warning/20 text-warning";
    return "bg-destructive/20 text-destructive";
  }
  return "bg-secondary";
}

export function ComparisonMatrix({ products, className }: ComparisonMatrixProps) {
  const winnerCells = useMemo(() => {
    const winners: Record<string, string> = {};
    SPEC_ROWS.forEach((row) => {
      if (row.type === "benchmark") {
        const vals = products.map((p) => benchmarkValue(p.specs ?? {}, row.key));
        const max = Math.max(...vals.filter((v): v is number => v !== null));
        const winnerIdx = vals.indexOf(max);
        if (winnerIdx >= 0) winners[row.key] = products[winnerIdx].id;
      } else if (row.type === "price") {
        const vals = products.map((p) => p.price ?? 0);
        const min = Math.min(...vals);
        const winnerIdx = vals.indexOf(min);
        if (winnerIdx >= 0) winners[row.key] = products[winnerIdx].id;
      }
    });
    return winners;
  }, [products]);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          KI-Vergleichs-Matrix
        </CardTitle>
        <CardDescription>
          {products.length} Produkte im direkten Vergleich. Grüne Zellen = bester Wert pro Kategorie.
        </CardDescription>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-3 font-semibold text-foreground w-48">Merkmal</th>
                {products.map((p) => (
                  <th key={p.id} className="pb-3 font-semibold text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{p.name}</span>
                      {p.manufacturer && <span className="text-xs text-muted-foreground">{p.manufacturer}</span>}
                      {p.price && (
                        <span className="text-xs font-medium">{p.price} {p.currency ?? "€"}</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="pb-3 font-semibold text-center text-xs text-muted-foreground">Sieger</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {SPEC_ROWS.map((row) => (
                <tr key={row.key} className="border-b">
                  <td className="pb-3 font-medium text-foreground">{row.label}</td>
                  {products.map((p, idx) => {
                    let cellContent = "—";
                    let cellClass = "bg-secondary text-center";

                    if (row.type === "benchmark") {
                      const bv = benchmarkValue(p.specs ?? {}, row.key);
                      if (bv !== null) {
                        cellContent = String(bv);
                        cellClass = cn("text-center font-medium", cellColor(row.type, bv, idx, products.map((pp) => benchmarkValue(pp.specs ?? {}, row.key))));
                      }
                    } else if (row.type === "price") {
                      cellContent = p.price ? `${p.price} ${p.currency ?? "€"}` : "—";
                      cellClass = cn("text-center font-medium", cellColor(row.type, p.price, idx, products.map((pp) => pp.price)));
                    } else {
                      cellContent = String(p.specs?.[row.key] ?? "—");
                      cellClass = "text-center";
                    }

                    const isWinner = winnerCells[row.key] === p.id;
                    return (
                      <td
                        key={`${row.key}-${p.id}`}
                        className={cn(
                          "pb-3 transition-colors",
                          isWinner ? "ring-2 ring-success bg-success/10" : "",
                          cellClass,
                        )}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                  <td className="pb-3 text-center">
                    {winnerCells[row.key] ? (
                      <Badge variant="default" className="w-fit">
                        {products.find((p) => p.id === winnerCells[row.key])?.name.split(" ")[0]}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
            <Share2 size={14} strokeWidth={2} />
            Teilen
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
            <Copy size={14} strokeWidth={2} />
            Link kopieren
          </Button>
        </div>
        <div className="flex gap-1 text-xs">
          {products.map((p) => (
            <a
              key={p.id}
              href={p.affiliateLink || "#"}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-xs font-medium transition-colors"
            >
              Bei {p.manufacturer || "Händler"} kaufen
            </a>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
