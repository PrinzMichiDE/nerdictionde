"use client";

import { BenchmarkResult } from "@/lib/benchmarks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BenchmarksSectionProps {
  benchmarks: BenchmarkResult[];
  isEn?: boolean;
}

function getBenchmarkColor(score: number, maxScore: number = 10000): string {
  const percentage = Math.min((score / maxScore) * 100, 100);
  if (percentage >= 80) return "text-green-500";
  if (percentage >= 60) return "text-primary";
  if (percentage >= 40) return "text-yellow-500";
  return "text-orange-500";
}

export function BenchmarksSection({ benchmarks, isEn = false }: BenchmarksSectionProps) {
  if (!benchmarks || benchmarks.length === 0) {
    return null;
  }

  // Find max score for normalization
  const maxScore = Math.max(...benchmarks.map(b => b.score), 10000);

  return (
    <Card className="border border-border rounded-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/5 rounded-md">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-serif text-2xl font-semibold tracking-tight">
              {isEn ? "Benchmarks" : "Benchmarks"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isEn ? "Performance benchmarks for key components" : "Performance-Benchmarks für wichtige Komponenten"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benchmarks.map((benchmark, idx) => {
            const percentage = Math.min((benchmark.score / maxScore) * 100, 100);
            return (
              <div
                key={idx}
                className="p-5 rounded-md bg-muted/40 border border-border"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs font-semibold flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {benchmark.benchmark}
                  </Badge>
                  {benchmark.source && (
                    <span className="text-xs text-muted-foreground">
                      {benchmark.source}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-serif text-3xl font-semibold tracking-tight ${getBenchmarkColor(benchmark.score, maxScore)}`}>
                      {benchmark.score.toLocaleString("de-DE")}
                    </span>
                    {benchmark.unit && (
                      <span className="text-sm text-muted-foreground">
                        {benchmark.unit}
                      </span>
                    )}
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground font-medium">
                    {benchmark.component}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
