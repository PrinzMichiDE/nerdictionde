import { Cpu, Building2, Calendar, Tag, CircleDollarSign } from "lucide-react";

interface HardwareMetadataProps {
  metadata: {
    manufacturer?: string | null;
    model?: string | null;
    type?: string | null;
    msrp?: number | null;
    releaseDate?: string | null;
  } | null;
  specs: Record<string, unknown> | null;
  isEn: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  gpu: "Grafikkarte",
  cpu: "Prozessor",
  motherboard: "Mainboard",
  ram: "Arbeitsspeicher",
  storage: "SSD / Festplatte",
  psu: "Netzteil",
  case: "Gehäuse",
  cooler: "Kühler",
  monitor: "Monitor",
  keyboard: "Tastatur",
  mouse: "Maus",
  headset: "Headset",
  controller: "Controller",
  console: "Konsole",
};

export function HardwareMetadata({ metadata, specs, isEn }: HardwareMetadataProps) {
  if (!metadata && !specs) return null;

  const typeLabel = metadata?.type ? TYPE_LABELS[metadata.type] || metadata.type : null;

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight border-b border-border pb-3">
        {isEn ? "Technical Specifications" : "Technische Daten"}
      </h2>

      {(metadata?.manufacturer || metadata?.model || typeLabel || metadata?.msrp || metadata?.releaseDate) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metadata?.manufacturer && (
            <div className="flex items-start gap-2">
              <Building2 className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hersteller</p>
                <p className="text-sm font-medium">{metadata.manufacturer}</p>
              </div>
            </div>
          )}
          {metadata?.model && (
            <div className="flex items-start gap-2">
              <Tag className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Modell</p>
                <p className="text-sm font-medium">{metadata.model}</p>
              </div>
            </div>
          )}
          {typeLabel && (
            <div className="flex items-start gap-2">
              <Cpu className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Typ</p>
                <p className="text-sm font-medium">{typeLabel}</p>
              </div>
            </div>
          )}
          {metadata?.msrp ? (
            <div className="flex items-start gap-2">
              <CircleDollarSign className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">UVP</p>
                <p className="text-sm font-medium">{metadata.msrp} €</p>
              </div>
            </div>
          ) : null}
          {metadata?.releaseDate && (
            <div className="flex items-start gap-2">
              <Calendar className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isEn ? "Release" : "Erschienen"}
                </p>
                <p className="text-sm font-medium">
                  {new Date(metadata.releaseDate).toLocaleDateString(isEn ? "en-US" : "de-DE", {
                    year: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {specs && typeof specs === "object" && Object.keys(specs).length > 0 && (
        <div className="rounded-md border border-border bg-muted/40 divide-y divide-border">
          {Object.entries(specs).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground capitalize">
                {key.replace(/[_-]/g, " ")}
              </span>
              <span className="text-sm font-medium tabular-nums">
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
