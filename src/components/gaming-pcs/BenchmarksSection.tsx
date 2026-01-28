"use client";

import { BenchmarkResult } from "@/lib/benchmarks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

interface BenchmarksSectionProps {
  benchmarks: BenchmarkResult[];
  isEn?: boolean;
}

export function BenchmarksSection({ benchmarks, isEn = false }: BenchmarksSectionProps) {
  if (!benchmarks || benchmarks.length === 0) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">
            {isEn ? "Benchmarks" : "Benchmarks"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benchmarks.map((benchmark, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-muted/50 border hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="secondary" className="text-xs font-bold uppercase">
                  {benchmark.benchmark}
                </Badge>
                {benchmark.source && (
                  <span className="text-xs text-muted-foreground">
                    {benchmark.source}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-primary">
                  {benchmark.score.toLocaleString()}
                </span>
                {benchmark.unit && (
                  <span className="text-sm text-muted-foreground">
                    {benchmark.unit}
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {benchmark.component}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
