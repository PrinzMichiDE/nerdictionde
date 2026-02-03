import { Metadata } from "next";
import { PCBuilder } from "@/components/pc-builder/PCBuilder";

export const metadata: Metadata = {
  title: "PC Builder | Nerdiction",
  description: "Konfiguriere deinen eigenen Gaming PC – Komponenten wählen, Preis berechnen, Kompatibilität prüfen.",
};

export default function PCBuilderPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <div className="max-w-3xl space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          PC Builder
        </h1>
        <p className="text-lg text-muted-foreground">
          Wähle Komponenten aus unseren Empfehlungen, sieh den Gesamtpreis und prüfe die Kompatibilität.
        </p>
      </div>
      <PCBuilder />
    </div>
  );
}
