import { Monitor, Cpu, HardDrive, CpuIcon, MemoryStick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SystemRequirementsProps {
  specs: {
    minimum?: {
      os?: string;
      cpu?: string;
      ram?: string;
      gpu?: string;
      storage?: string;
      directx?: string;
      network?: string;
      notes?: string;
    };
    recommended?: {
      os?: string;
      cpu?: string;
      ram?: string;
      gpu?: string;
      storage?: string;
      directx?: string;
      network?: string;
      notes?: string;
    };
  };
  isEn?: boolean;
}

const specIcons = {
  os: Monitor,
  cpu: Cpu,
  ram: MemoryStick,
  gpu: CpuIcon,
  storage: HardDrive,
  directx: Monitor,
  network: Monitor,
};

const specLabels = {
  os: { de: "Betriebssystem", en: "OS" },
  cpu: { de: "Prozessor", en: "CPU" },
  ram: { de: "Arbeitsspeicher", en: "RAM" },
  gpu: { de: "Grafikkarte", en: "GPU" },
  storage: { de: "Speicherplatz", en: "Storage" },
  directx: { de: "DirectX", en: "DirectX" },
  network: { de: "Internet", en: "Network" },
};

export function SystemRequirements({ specs, isEn = false }: SystemRequirementsProps) {
  if (!specs || (!specs.minimum && !specs.recommended)) return null;

  const renderSpecs = (type: "minimum" | "recommended", specData: any) => {
    const entries = Object.entries(specData).filter(
      ([key]) => key !== "notes"
    );

    return (
      <Card
        className={cn(
          "overflow-hidden transition-all hover:shadow-lg",
          type === "minimum"
            ? "border-yellow-500/30 bg-yellow-500/5"
            : "border-green-500/30 bg-green-500/5"
        )}
      >
        <CardHeader className={cn("pb-3", type === "minimum" ? "bg-yellow-500/10" : "bg-green-500/10")}>
          <CardTitle className="text-lg font-bold capitalize flex items-center gap-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full",
                type === "minimum" ? "bg-yellow-500" : "bg-green-500"
              )}
              aria-hidden="true"
            />
            {isEn
              ? type === "minimum"
                ? "Minimum Requirements"
                : "Recommended Requirements"
              : type === "minimum"
              ? "Mindestanforderungen"
              : "Empfohlene Anforderungen"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {entries.map(([key, value]) => {
            const Icon = specIcons[key as keyof typeof specIcons];
            const label = specLabels[key as keyof typeof specLabels];

            if (!value || !label) return null;

            return (
              <div
                key={key}
                className="flex items-start gap-3 text-sm"
                role="listitem"
              >
                {Icon && (
                  <Icon
                    className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground/70 block mb-1">
                    {isEn ? label.en : label.de}
                  </span>
                  <span className="text-foreground/90 break-words">{value as string}</span>
                </div>
              </div>
            );
          })}
          {specData.notes && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground italic">
                {specData.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="space-y-6 pt-10 border-t" aria-labelledby="system-requirements-heading">
      <h2
        id="system-requirements-heading"
        className="text-3xl font-bold flex items-center gap-3"
      >
        <Monitor className="h-8 w-8 text-primary" aria-hidden="true" />
        {isEn ? "System Requirements" : "Systemanforderungen"}
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {specs.minimum && renderSpecs("minimum", specs.minimum)}
        {specs.recommended && renderSpecs("recommended", specs.recommended)}
      </div>

      {/* Additional Info */}
      {(specs.minimum?.notes || specs.recommended?.notes) && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">
              {isEn ? "Note:" : "Hinweis:"}
            </strong>{" "}
            {specs.minimum?.notes || specs.recommended?.notes}
          </p>
        </div>
      )}
    </section>
  );
}
