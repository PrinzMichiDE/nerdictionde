"use strict";

/**
 * Radar-Chart: Testergebnisse nach Kategorie (Leistung, Verarbeitung, Features, Preis-Leistung, Langlebigkeit)
 * SVG, keine externe Dependency.
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadarCategory {
  label: string;
  value: number; // 0-100
}

interface RadarChartProps {
  categories: RadarCategory[];
  productName?: string;
  className?: string;
}

export function TestCategoriesRadar({ categories, productName, className }: RadarChartProps) {
  if (categories.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Testkategorien</CardTitle>
          <CardDescription>Keine Daten verfügbar.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const width = 260;
  const height = 240;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 90;
  const levels = 5; // 0, 20, 40, 60, 80, 100
  const angleStep = (2 * Math.PI) / categories.length;

  // Polygon-Punkte berechnen
  const points = categories.map((cat, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (cat.value / 100) * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y, label: cat.label, value: cat.value, angle };
  });

  // Achsen-Linien und Etiketten
  const axes = categories.map((cat, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x2 = centerX + radius * Math.cos(angle);
    const y2 = centerY + radius * Math.sin(angle);
    const lx = centerX + (radius + 18) * Math.cos(angle);
    const ly = centerY + (radius + 18) * Math.sin(angle);
    const textAnchor = Math.cos(angle) > 0.1 ? "start" : Math.cos(angle) < -0.1 ? "end" : "middle";
    return { x1: centerX, y1: centerY, x2, y2, lx, ly, label: cat.label, textAnchor };
  });

  // Konzentrische Polygone (Level-Linien)
  const gridLines = [];
  for (let level = 1; level <= levels; level++) {
    const r = (level / levels) * radius;
    const pts = categories.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
    });
    gridLines.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="hsl(var(--border))" strokeWidth="1"/>`);
  }

  const dataPolygon = points.map((p) => `${p.x},${p.y}`).join(" ");
  const dataPolygonClosed = `${dataPolygon} ${points[0].x},${points[0].y}`;

  const avgValue = categories.reduce((sum, c) => sum + c.value, 0) / categories.length;
  const avgColor = avgValue >= 75 ? "success" : avgValue >= 55 ? "warning" : "destructive";

  return (
    <Card className={className}>
      <CardHeader className="pb-3 flex items-center justify-between">
        <div>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target size={16} strokeWidth={2} />
            Testergebnisse nach Kategorie
          </CardTitle>
          {productName && <CardDescription className="text-xs">{productName}</CardDescription>}
        </div>
        <Badge variant={avgColor === "success" || avgColor === "warning" ? "default" : avgColor} className="text-xs">
          Ø {avgValue.toFixed(0)}/100
        </Badge>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="relative w-full h-[240px] flex items-center justify-center">
          <svg width={width} height={height} className="w-full h-full">
            {gridLines.map((gl, i) => (
              <span key={i} dangerouslySetInnerHTML={{ __html: gl }} />
            ))}
            {axes.map((a) => (
              <line key={a.label} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="hsl(var(--border))" strokeWidth="1" />
            ))}
            {axes.map((a) => (
              <text
                key={a.label}
                x={a.lx}
                y={a.ly}
                fontSize="11"
                fill="hsl(var(--muted-foreground))"
                textAnchor={a.textAnchor as "start" | "middle" | "end"}
                dominantBaseline="middle"
              >
                {a.label}
              </text>
            ))}
            <polygon
              points={dataPolygonClosed}
              fill="hsl(var(--primary))"
              fillOpacity="0.15"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            {points.map((p) => (
              <circle
                key={p.label}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {categories.map((cat) => (
            <div key={cat.label} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/50">
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-medium">{cat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
