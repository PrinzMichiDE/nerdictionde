"use client";

import { PCComponent } from "@/types/pc-build";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompatibilityCheckProps {
  components: PCComponent[];
  isEn?: boolean;
}

/**
 * Estimates GPU power requirements based on GPU model name
 * Returns recommended PSU wattage in watts
 */
function getGPURecommendedPSU(gpuName: string): number {
  const name = gpuName.toLowerCase();
  
  // RTX 40 Series
  if (name.includes("rtx 4090")) return 850;
  if (name.includes("rtx 4080")) return 750;
  if (name.includes("rtx 4070 ti") || name.includes("rtx 4070ti")) return 650;
  if (name.includes("rtx 4070")) return 600;
  if (name.includes("rtx 4060 ti") || name.includes("rtx 4060ti")) return 550;
  if (name.includes("rtx 4060")) return 500;
  
  // RTX 30 Series
  if (name.includes("rtx 3090")) return 750;
  if (name.includes("rtx 3080 ti") || name.includes("rtx 3080ti")) return 750;
  if (name.includes("rtx 3080")) return 750;
  if (name.includes("rtx 3070 ti") || name.includes("rtx 3070ti")) return 650;
  if (name.includes("rtx 3070")) return 650;
  if (name.includes("rtx 3060 ti") || name.includes("rtx 3060ti")) return 600;
  if (name.includes("rtx 3060")) return 550;
  
  // RTX 20 Series
  if (name.includes("rtx 2080 ti") || name.includes("rtx 2080ti")) return 650;
  if (name.includes("rtx 2080")) return 650;
  if (name.includes("rtx 2070")) return 550;
  if (name.includes("rtx 2060")) return 500;
  
  // RX 7000 Series
  if (name.includes("rx 7900 xtx") || name.includes("rx 7900xtx")) return 800;
  if (name.includes("rx 7900 xt") || name.includes("rx 7900xt")) return 750;
  if (name.includes("rx 7800 xt") || name.includes("rx 7800xt")) return 700;
  if (name.includes("rx 7700 xt") || name.includes("rx 7700xt")) return 650;
  if (name.includes("rx 7600")) return 550;
  
  // RX 6000 Series
  if (name.includes("rx 6900")) return 850;
  if (name.includes("rx 6800 xt") || name.includes("rx 6800xt")) return 750;
  if (name.includes("rx 6800")) return 650;
  if (name.includes("rx 6700 xt") || name.includes("rx 6700xt")) return 650;
  if (name.includes("rx 6600 xt") || name.includes("rx 6600xt")) return 500;
  if (name.includes("rx 6600")) return 500;
  
  // GTX Series (older)
  if (name.includes("gtx 1660")) return 450;
  if (name.includes("gtx 1650")) return 350;
  if (name.includes("gtx 1080")) return 500;
  if (name.includes("gtx 1070")) return 500;
  if (name.includes("gtx 1060")) return 400;
  
  // Default estimates based on keywords
  if (name.includes("ti") || name.includes("super")) {
    // High-end variants
    if (name.includes("70") || name.includes("80") || name.includes("90")) return 700;
    if (name.includes("60")) return 550;
  }
  
  if (name.includes("70") || name.includes("80") || name.includes("90")) return 600;
  if (name.includes("60")) return 500;
  if (name.includes("50")) return 400;
  
  // Very conservative default for unknown GPUs
  return 500;
}

/**
 * Extracts PSU wattage from component name or specs
 */
function getPSUWattage(psu: PCComponent): number | null {
  // Try to extract from specs first
  if (psu.specs && typeof psu.specs === 'object') {
    if (psu.specs.wattage) return Number(psu.specs.wattage);
    if (psu.specs.power) return Number(psu.specs.power);
    if (psu.specs.watts) return Number(psu.specs.watts);
  }
  
  // Try to extract from name (e.g., "650W", "750 W", "850W PSU")
  const name = psu.name.toLowerCase();
  const wattageMatch = name.match(/(\d+)\s*w/i);
  if (wattageMatch) {
    return parseInt(wattageMatch[1], 10);
  }
  
  return null;
}

export function CompatibilityCheck({ components, isEn = false }: CompatibilityCheckProps) {
  const gpu = components.find(c => c.type === "GPU");
  const psu = components.find(c => c.type === "PSU");
  
  if (!gpu || !psu) {
    return null;
  }
  
  const recommendedPSU = getGPURecommendedPSU(gpu.name);
  const actualPSU = getPSUWattage(psu);
  
  if (!actualPSU) {
    // Can't determine PSU wattage, show info message
    return (
      <Card className="border border-border rounded-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <CardTitle className="font-serif text-lg font-semibold tracking-tight">
              {isEn ? "PSU Compatibility" : "Netzteil-Kompatibilität"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isEn 
              ? `For the ${gpu.name}, we recommend a power supply of at least ${recommendedPSU}W. Please verify that your PSU meets this requirement.`
              : `Für die ${gpu.name} empfehlen wir ein Netzteil mit mindestens ${recommendedPSU}W. Bitte überprüfe, ob dein Netzteil diese Anforderung erfüllt.`}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const difference = actualPSU - recommendedPSU;
  const isCompatible = actualPSU >= recommendedPSU;
  const isClose = difference >= -50 && difference < 0; // Within 50W but below recommendation
  const isOptimal = difference >= 100; // 100W+ headroom
  
  return (
    <Card className="border border-border rounded-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isCompatible && isOptimal && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {isCompatible && !isOptimal && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
            {!isCompatible && isClose && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
            {!isCompatible && !isClose && <AlertCircle className="h-5 w-5 text-red-500" />}
            <CardTitle className="font-serif text-lg font-semibold tracking-tight">
              {isEn ? "PSU Compatibility" : "Netzteil-Kompatibilität"}
            </CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "font-semibold",
              isCompatible && isOptimal && "border-green-500/50 text-green-600",
              isCompatible && !isOptimal && "border-blue-500/50 text-blue-600",
              !isCompatible && isClose && "border-yellow-500/50 text-yellow-600",
              !isCompatible && !isClose && "border-red-500/50 text-red-600"
            )}
          >
            {actualPSU}W
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span className="font-medium">{isEn ? "GPU" : "Grafikkarte"}</span>
            </div>
            <div className="font-bold">{gpu.name}</div>
            <div className="text-sm text-muted-foreground">
              {isEn ? "Recommended PSU" : "Empfohlenes Netzteil"}: <span className="font-bold text-foreground">{recommendedPSU}W</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span className="font-medium">{isEn ? "PSU" : "Netzteil"}</span>
            </div>
            <div className="font-bold">{psu.name}</div>
            <div className="text-sm text-muted-foreground">
              {isEn ? "Actual Power" : "Tatsächliche Leistung"}: <span className="font-bold text-foreground">{actualPSU}W</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-md border border-border bg-muted">
          {isCompatible && isOptimal && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {isEn ? "Excellent Compatibility" : "Ausgezeichnete Kompatibilität"}
              </div>
              <p className="text-sm text-muted-foreground">
                {isEn 
                  ? `Your ${actualPSU}W power supply provides excellent headroom for the ${gpu.name}. This ensures stable performance even under heavy load.`
                  : `Dein ${actualPSU}W-Netzteil bietet ausgezeichneten Puffer für die ${gpu.name}. Dies gewährleistet stabile Performance auch unter hoher Last.`}
              </p>
            </div>
          )}
          {isCompatible && !isOptimal && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
                {isEn ? "Compatible" : "Kompatibel"}
              </div>
              <p className="text-sm text-muted-foreground">
                {isEn 
                  ? `Your ${actualPSU}W power supply meets the minimum requirements for the ${gpu.name}. The system should work fine, but consider upgrading for better efficiency and headroom.`
                  : `Dein ${actualPSU}W-Netzteil erfüllt die Mindestanforderungen für die ${gpu.name}. Das System sollte funktionieren, aber ein Upgrade wäre für bessere Effizienz und mehr Puffer empfehlenswert.`}
              </p>
            </div>
          )}
          {!isCompatible && isClose && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                {isEn ? "Warning: Close to Limit" : "Warnung: Nahe am Limit"}
              </div>
              <p className="text-sm text-muted-foreground">
                {isEn 
                  ? `Your ${actualPSU}W power supply is below the recommended ${recommendedPSU}W for the ${gpu.name}. While it might work, we strongly recommend upgrading to avoid stability issues and potential damage.`
                  : `Dein ${actualPSU}W-Netzteil liegt unter der empfohlenen ${recommendedPSU}W für die ${gpu.name}. Es könnte funktionieren, aber wir empfehlen dringend ein Upgrade, um Stabilitätsprobleme und mögliche Schäden zu vermeiden.`}
              </p>
            </div>
          )}
          {!isCompatible && !isClose && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-red-600">
                <AlertCircle className="h-4 w-4" />
                {isEn ? "Incompatible" : "Nicht kompatibel"}
              </div>
              <p className="text-sm text-muted-foreground">
                {isEn 
                  ? `Your ${actualPSU}W power supply is insufficient for the ${gpu.name}, which requires at least ${recommendedPSU}W. You must upgrade your PSU before using this GPU to prevent system instability and potential hardware damage.`
                  : `Dein ${actualPSU}W-Netzteil ist unzureichend für die ${gpu.name}, die mindestens ${recommendedPSU}W benötigt. Du musst dein Netzteil upgraden, bevor du diese GPU verwendest, um Systeminstabilität und mögliche Hardwareschäden zu vermeiden.`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
