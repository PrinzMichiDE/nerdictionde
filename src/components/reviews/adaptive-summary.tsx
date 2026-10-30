"use client";

"use strict";

/**
 * Adaptive Zusammenfassung: Profi vs. Einsteiger + automatisches TL;DR
 *
 * Gleiche Review, zwei Lesemodi. Umschaltbar per Toggle.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdaptiveSummaryProps {
  review: {
    title: string;
    score: number;
    pros: string[];
    cons: string[];
    content: string;
    category?: string;
  };
  className?: string;
}

const EXPERT_SUMMARY = {
  title: "Fazit für Profis",
  icon: GraduationCap,
  text: (r: any) => `Mit einem Score von ${r.score}/100 positioniert sich ${r.title} im ${r.pros.length > r.cons.length ? "oberen" : "mittleren"} Segment. Entscheidende Stärken: ${r.pros.slice(0, 3).join(", ")}. Kritische Punkte: ${r.cons.slice(0, 3).join(", ")}. Die technischen Spezifikationen und Benchmark-Ergebnisse bestätigen die Einordnung in die Kategorie "${r.category}".`,
};

const BEGINNER_SUMMARY = {
  title: "Fazit für Einsteiger",
  icon: BookOpen,
  text: (r: any) => `${r.title} ist eine solide Wahl mit ${r.score} von 100 Punkten. Besonders gut: ${r.pros.slice(0, 2).join(" und ")}. Worauf du achten solltest: ${r.cons.slice(0, 2).join(" und ")}.`,
};

const TLDR = {
  title: "TL;DR – Die 3-Sekunden-Zusammenfassung",
  icon: Clock,
  text: (r: any) => `${r.title}: ${r.score}/100. ${r.pros.length > 0 ? "Top: " + r.pros[0] + ". " : ""}${r.cons.length > 0 ? "Flop: " + r.cons[0] + "." : ""}`,
};

export function AdaptiveSummary({ review, className }: AdaptiveSummaryProps) {
  const [mode, setMode] = useState<"expert" | "beginner" | "tldr">("tldr");

  const summaries = {
    expert: EXPERT_SUMMARY,
    beginner: BEGINNER_SUMMARY,
    tldr: TLDR,
  };

  const active = summaries[mode];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {active.icon && <active.icon size={18} strokeWidth={2} />}
          {active.title}
        </CardTitle>
        <CardDescription>
          Wähle den Lesemodus, der zu dir passt.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "tldr" ? "default" : "outline"}
            onClick={() => setMode("tldr")}
          >
            <Clock size={14} strokeWidth={2} className="mr-2" />
            TL;DR
          </Button>
          <Button
            size="sm"
            variant={mode === "beginner" ? "default" : "outline"}
            onClick={() => setMode("beginner")}
          >
            <BookOpen size={14} strokeWidth={2} className="mr-2" />
            Einsteiger
          </Button>
          <Button
            size="sm"
            variant={mode === "expert" ? "default" : "outline"}
            onClick={() => setMode("expert")}
          >
            <GraduationCap size={14} strokeWidth={2} className="mr-2" />
            Profi
          </Button>
        </div>

        <div className="pt-2">
          <Badge variant={review.score >= 75 ? "default" : review.score >= 55 ? "default" : "destructive"}>
            {review.score} / 100
          </Badge>
          <p className="mt-2 text-foreground/90">{active.text(review)}</p>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Modus: {mode === "tldr" ? "Kurz" : mode === "beginner" ? "Einfach" : "Technisch"}
        </span>
        <a href="#" className="text-xs text-primary underline-offset-4 hover:underline">
          Vollständiger Testbericht
        </a>
      </CardFooter>
    </Card>
  );
}
