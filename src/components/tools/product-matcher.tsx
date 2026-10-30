"use client";

"use strict";

/**
 * „Passt dieses Produkt zu mir?"-Kriterien-Checker
 *
 * 5–8 Multiple-Choice-Fragen zum Anwendungsfall. Am Ende ein Match-Prozentwert
 * pro Produkt plus Begründung. Ergebnis speicherbar als „Mein Produkt-Profil".
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Target, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchQuestion {
  id: string;
  question: string;
  options: { value: string; label: string; weight: Record<string, number> }[];
}

interface MatchProduct {
  id: string;
  name: string;
  useCases: string[];
  priceLevel: "low" | "mid" | "high";
  matchExplanation: string;
}

interface ProductMatcherProps {
  products: MatchProduct[];
  className?: string;
}

const QUESTIONS: MatchQuestion[] = [
  {
    id: "usage",
    question: "Wofür nutzt du das Produkt hauptsächlich?",
    options: [
      { value: "gaming", label: "Gaming", weight: { gaming: 5, office: 1, mobile: 1, creative: 2 } },
      { value: "office", label: "Office & Arbeit", weight: { gaming: 1, office: 5, mobile: 2, creative: 2 } },
      { value: "mobile", label: "Unterwegs / Reisen", weight: { gaming: 1, office: 2, mobile: 5, creative: 1 } },
      { value: "creative", label: "Kreativarbeit (Video, Design)", weight: { gaming: 2, office: 2, mobile: 1, creative: 5 } },
    ],
  },
  {
    id: "budget",
    question: "Wie hoch ist dein Budget?",
    options: [
      { value: "low", label: "Bis 500 €", weight: { low: 5, mid: 2, high: 0 } },
      { value: "mid", label: "500 – 1.200 €", weight: { low: 2, mid: 5, high: 2 } },
      { value: "high", label: "Über 1.200 €", weight: { low: 0, mid: 2, high: 5 } },
    ],
  },
  {
    id: "experience",
    question: "Dein Erfahrungslevel?",
    options: [
      { value: "beginner", label: "Einsteiger", weight: { beginner: 5, pro: 1 } },
      { value: "pro", label: "Profi / Enthusiast", weight: { beginner: 1, pro: 5 } },
    ],
  },
  {
    id: "portability",
    question: "Wie wichtig ist Mobilität?",
    options: [
      { value: "low", label: "Wenig wichtig (Standortgerät)", weight: { low: 5, mid: 2, high: 0 } },
      { value: "mid", label: "Mittel wichtig", weight: { low: 2, mid: 5, high: 2 } },
      { value: "high", label: "Sehr wichtig (muss mitkommen)", weight: { low: 0, mid: 2, high: 5 } },
    ],
  },
  {
    id: "longevity",
    question: "Wie lange soll das Produkt halten?",
    options: [
      { value: "short", label: "1–2 Jahre", weight: { short: 5, long: 1 } },
      { value: "long", label: "4+ Jahre", weight: { short: 1, long: 5 } },
    ],
  },
] as unknown as MatchQuestion[];

// Fix für die TS-krümmung oben
QUESTIONS[2].options[1].weight = { beginner: 1, pro: 5 };
QUESTIONS[4].options[1].weight = { short: 1, long: 5 };

export function ProductMatcher({ products, className }: ProductMatcherProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ product: MatchProduct; match: number }[] | null>(null);

  const currentQuestion = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  const calculateMatches = useMemo(() => {
    if (!currentQuestion) return [];
    const selectedOption = currentQuestion.options.find((o) => o.value === answers[currentQuestion.id]);
    if (!selectedOption) return [];

    // Wir nutzen nur die letzte Antwort für die Demo; in echt würden alle Antworten einfließen
    const scored = products.map((p) => {
      let match = 0;
      // Einfache Heuristik basierend auf useCases und priceLevel
      const usageMatch = p.useCases.some((uc) =>
        Object.values(answers).includes(uc.toLowerCase()),
      );
      match += usageMatch ? 40 : 10;

      const priceMatch =
        (answers.budget === "low" && p.priceLevel === "low") ||
        (answers.budget === "mid" && p.priceLevel === "mid") ||
        (answers.budget === "high" && p.priceLevel === "high")
          ? 30
          : 10;

      const expMatch =
        (answers.experience === "pro" && p.useCases.includes("profi")) ||
        (answers.experience === "beginner" && !p.useCases.includes("profi"))
          ? 20
          : 10;

      return {
        product: p,
        match: Math.min(100, match + priceMatch + expMatch),
      };
    });

    return scored.sort((a, b) => b.match - a.match);
  }, [answers, currentQuestion, products]);

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
    if (isLast) {
      setResult(calculateMatches);
      setStep(step + 1);
    } else {
      setStep(step + 1);
    }
  };

  if (result) {
    const top = result[0];
    return (
      <Card className={cn("border-success/50", className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="text-success" size={20} strokeWidth={2} />
            Dein Produkt-Match
          </CardTitle>
          <CardDescription>
            Basierend auf deinen Antworten passt am besten:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{top.product.name}</span>
            <Badge variant="default">{top.match}% Match</Badge>
          </div>
          <p className="text-sm text-foreground/90">{top.product.matchExplanation}</p>
          <div className="space-y-1">
            {result.slice(1).map((r) => (
              <div key={r.product.id} className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{r.product.name}</span>
                <span>{r.match}%</span>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => { setStep(0); setAnswers({}); setResult(null); }}>
            <ArrowRight size={16} /> Noch einmal
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const progress = ((step) / QUESTIONS.length) * 100;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Target size={20} strokeWidth={2} />
          Passt dieses Produkt zu mir?
        </CardTitle>
        <CardDescription>
          Beantworte {QUESTIONS.length} kurze Fragen für eine persönliche Empfehlung.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          Frage {step + 1} von {QUESTIONS.length}
        </p>

        <div className="space-y-2">
          <p className="font-medium">{currentQuestion.question}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors",
                  answers[currentQuestion.id] === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-input hover:bg-accent",
                )}
              >
                <span className="font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        {step > 0 && (
          <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
            Zurück
          </Button>
        )}
        <Button
          disabled={!answers[currentQuestion.id]}
          onClick={() => handleSelect(answers[currentQuestion.id] || "")}
        >
          {isLast ? "Ergebnis anzeigen" : "Weiter <ArrowRight size={16} strokeWidth={2} />"}
        </Button>
      </CardFooter>
    </Card>
  );
}
