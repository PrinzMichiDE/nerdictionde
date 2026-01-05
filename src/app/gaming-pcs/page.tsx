import { PCBuildCard } from "@/components/gaming-pcs/PCBuildCard";
import prisma from "@/lib/prisma";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beste Gaming PCs 2026 | Nerdiction",
  description: "Die besten Gaming PC Zusammenstellungen für jedes Budget. Von 300€ bis 4500€ - monatlich aktualisiert und optimiert für maximale Performance.",
};

async function getPCBuilds() {
  return await prisma.pCBuild.findMany({
    where: {
      status: "published",
    },
    include: {
      components: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      pricePoint: "asc",
    },
  });
}

export default async function GamingPCsPage() {
  const builds = await getPCBuilds();

  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none uppercase">
          Die besten <span className="text-primary">Gaming PCs</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Hier findest du immer die aktuellsten und besten Gaming PC Zusammenstellungen für jedes Budget. 
          Unsere Konfigurationen werden regelmäßig aktualisiert, um dir das beste Preis-Leistungs-Verhältnis zu garantieren.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 text-sm font-bold text-primary">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            HardwareDealz Empfehlungen
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border text-sm font-medium">
            Januar 2026 Update
          </div>
          <div className="bg-muted/50 px-4 py-2 rounded-full border text-sm font-medium">
            Bestes Preis-Leistungs-Verhältnis
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {builds.length > 0 ? (
          builds.map((build) => (
            <PCBuildCard key={build.id} build={build as any} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <h2 className="text-2xl font-bold">Noch keine PC-Builds veröffentlicht.</h2>
            <p className="text-muted-foreground">Schau bald wieder vorbei!</p>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="max-w-3xl mx-auto bg-muted/30 p-8 md:p-12 rounded-3xl border space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight">Worauf wir bei unseren Empfehlungen achten</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-bold text-primary">Preisleistung</h3>
            <p className="text-sm text-muted-foreground">Wir wählen Komponenten, die für ihr Geld die maximale Performance liefern.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-primary">Aktualität</h3>
            <p className="text-sm text-muted-foreground">Unsere Listen werden monatlich geprüft und bei Preisänderungen angepasst.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-primary">Kompatibilität</h3>
            <p className="text-sm text-muted-foreground">Alle Teile in einem Build passen garantiert zu 100% zusammen.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-primary">Aufrüstbarkeit</h3>
            <p className="text-sm text-muted-foreground">Wir achten darauf, dass du dein System auch in Zukunft einfach erweitern kannst.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

