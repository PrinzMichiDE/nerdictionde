"use client";

import React from "react";
import { ScoreBlock } from "@/components/shared/ScoreBlock";

interface ReviewCompareScoreCompareProps {
  scores: number[];
  labels: string[];
  average: number | null;
  diffs: number[];
}

export function ReviewCompareScoreCompare({ scores, labels, average, diffs }: ReviewCompareScoreCompareProps) {
  if (scores.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${scores.length}, 1fr)` }}>
        {scores.map((score, i) => (
          <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
            <ScoreBlock score={score} className="w-20 h-20 mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground truncate">{labels[i]}</p>
            <p className="text-lg font-semibold tabular-nums">{score}/100</p>
            {average !== null && (
              <p className={`text-xs font-medium ${diffs[i] >= 0 ? "text-green-600" : "text-red-600"}`}>
                {diffs[i] >= 0 ? "+" : ""}{diffs[i]} vs. Ø
              </p>
            )}
          </div>
        ))}
      </div>

      {average !== null && scores.length > 1 && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Durchschnitt aller verglichenen Reviews</span>
            <span className="font-semibold tabular-nums">{average}/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted mt-2">
            <div
              className="h-full rounded-full bg-muted-foreground/30"
              style={{ width: `${average}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}