"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ComponentItem {
  id: string;
  name: string;
  type: string;
}

interface CompatibilityCheckerProps {
  selected: Record<string, ComponentItem>;
}

export function CompatibilityChecker({ selected }: CompatibilityCheckerProps) {
  const [result, setResult] = useState<{ compatible: boolean; issues: Array<{ type: string; message: string }> } | null>(null);

  useEffect(() => {
    const components = Object.entries(selected).map(([type, c]) => ({ type, id: c.id }));
    if (components.length === 0) {
      setResult(null);
      return;
    }
    fetch("/api/pc-builder/check-compatibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ components }),
    })
      .then((res) => res.json())
      .then(setResult)
      .catch(() => setResult({ compatible: true, issues: [] }));
  }, [selected]);

  if (result == null) {
    return (
      <div className="text-sm text-muted-foreground">
        Wähle Komponenten für eine Kompatibilitätsprüfung.
      </div>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          {result.compatible ? (
            <CheckCircle2 className="size-4 text-green-500" />
          ) : (
            <AlertCircle className="size-4 text-amber-500" />
          )}
          Kompatibilität
        </h3>
        {result.issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Probleme erkannt.</p>
        ) : (
          <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
            {result.issues.map((i, idx) => (
              <li key={idx}>{i.message}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
