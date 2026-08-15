"use client";

import { FPSResult } from "@/lib/benchmarks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FPSSectionProps {
  fpsResults: FPSResult[];
  isEn?: boolean;
}

export function FPSSection({ fpsResults, isEn = false }: FPSSectionProps) {
  if (!fpsResults || fpsResults.length === 0) {
    return null;
  }

  // Group FPS results by game
  const fpsByGame = fpsResults.reduce((acc, result) => {
    if (!acc[result.game]) {
      acc[result.game] = [];
    }
    acc[result.game].push(result);
    return acc;
  }, {} as Record<string, FPSResult[]>);

  // Get FPS color based on value
  const getFPSColor = (fps: number): string => {
    if (fps >= 120) return "text-green-500";
    if (fps >= 60) return "text-primary";
    if (fps >= 30) return "text-yellow-500";
    return "text-red-500";
  };

  // Get FPS quality label
  const getFPSQuality = (fps: number): string => {
    if (fps >= 120) return isEn ? "Excellent" : "Ausgezeichnet";
    if (fps >= 60) return isEn ? "Great" : "Sehr gut";
    if (fps >= 30) return isEn ? "Good" : "Gut";
    return isEn ? "Playable" : "Spielbar";
  };

  return (
    <Card className="border border-border rounded-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/5 rounded-md">
            <Gamepad2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-serif text-2xl font-semibold tracking-tight">
              {isEn ? "Gaming Performance" : "Gaming Performance"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isEn
                ? "Estimated FPS in popular games at different resolutions"
                : "Geschätzte FPS in beliebten Spielen bei verschiedenen Auflösungen"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(fpsByGame).map(([game, results]) => (
            <div key={game} className="p-5 rounded-md bg-muted/40 border border-border">
              <h3 className="font-serif text-xl font-semibold tracking-tight mb-5 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                {game}
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {results.map((result, idx) => (
                  <div key={idx} className="p-4 rounded-md bg-card border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-semibold">
                        {result.resolution}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {result.settings}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className={`font-serif text-3xl font-semibold tracking-tight ${getFPSColor(result.fps)}`}>
                          {result.fps}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">FPS</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs font-semibold",
                            getFPSColor(result.fps).replace("text-", "border-")
                          )}
                        >
                          {getFPSQuality(result.fps)}
                        </Badge>
                        {result.source && (
                          <span className="text-muted-foreground text-xs">
                            {result.source}
                          </span>
                        )}
                      </div>
                      <Progress 
                        value={Math.min((result.fps / 144) * 100, 100)} 
                        className="h-2.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
