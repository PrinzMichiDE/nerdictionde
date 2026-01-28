"use client";

import { FPSResult } from "@/lib/benchmarks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Gamepad2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">
            {isEn ? "Gaming Performance" : "Gaming Performance"}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {isEn
            ? "Estimated FPS in popular games at different resolutions"
            : "Geschätzte FPS in beliebten Spielen bei verschiedenen Auflösungen"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(fpsByGame).map(([game, results]) => (
            <div key={game} className="p-4 rounded-xl bg-muted/50 border hover:bg-muted/80 transition-colors">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                {game}
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {results.map((result, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-bold">
                        {result.resolution}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {result.settings}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-black ${getFPSColor(result.fps)}`}>
                          {result.fps}
                        </span>
                        <span className="text-sm text-muted-foreground">FPS</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={getFPSColor(result.fps)}>
                          {getFPSQuality(result.fps)}
                        </span>
                        {result.source && (
                          <span className="text-muted-foreground">
                            {result.source}
                          </span>
                        )}
                      </div>
                      <Progress 
                        value={Math.min((result.fps / 144) * 100, 100)} 
                        className="h-2"
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
