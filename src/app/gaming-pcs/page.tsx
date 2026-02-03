import prisma from "@/lib/prisma";
import { Metadata } from "next";
import { GamingPCsTabs } from "@/components/gaming-pcs/GamingPCsTabs";
import { PCBuild } from "@/types/pc-build";

export const metadata: Metadata = {
  title: "Beste Gaming PCs & Laptops 2026 | Nerdiction",
  description: "Die besten Gaming PC & Laptop Zusammenstellungen für jedes Budget. Von 300€ bis 4500€ - monatlich aktualisiert und optimiert für maximale Performance.",
};

async function getBuilds(type: "desktop" | "laptop" = "desktop") {
  // Get all published builds first, then filter by type
  // This handles cases where type might be null or undefined
  const allBuilds = await prisma.pCBuild.findMany({
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

  // Debug: Log what we found
  if (process.env.NODE_ENV === "development") {
    console.log(`[getBuilds] Found ${allBuilds.length} published builds total`);
    if (allBuilds.length > 0) {
      console.log(`[getBuilds] Sample build types:`, allBuilds.slice(0, 3).map(b => ({ id: b.id, type: b.type, title: b.title })));
    }
  }

  // Debug: Log what we found
  if (process.env.NODE_ENV === "development") {
    console.log(`[getBuilds(${type})] Found ${allBuilds.length} published builds total`);
    if (allBuilds.length > 0) {
      console.log(`[getBuilds(${type})] Sample build types:`, allBuilds.slice(0, 3).map(b => ({ id: b.id, type: b.type || "null", title: b.title })));
    }
  }

  // Filter by type, treating null/undefined as "desktop" (legacy builds)
  const filteredBuilds = allBuilds.filter((build) => {
    const buildType = build.type || "desktop"; // Default to desktop if type is null
    return buildType === type;
  });
  
  return filteredBuilds;
}

export default async function GamingPCsPage() {
  const desktops = await getBuilds("desktop");
  const laptops = await getBuilds("laptop");

  // Debug logging (remove in production if not needed)
  if (process.env.NODE_ENV === "development") {
    console.log(`[GamingPCsPage] Found ${desktops.length} desktop builds, ${laptops.length} laptop builds`);
  }

  const totalBuilds = desktops.length + laptops.length;
  const currentMonth = new Date().toLocaleString("de-DE", { month: "long", year: "numeric" });

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-16">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto text-center space-y-8">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none uppercase">
            Die besten <span className="text-primary">Gaming Setups</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Hier findest du immer die aktuellsten und besten Gaming PC & Laptop Zusammenstellungen für jedes Budget. 
            Unsere Konfigurationen werden regelmäßig aktualisiert, um dir das beste Preis-Leistungs-Verhältnis zu garantieren.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <div className="flex items-center gap-2 bg-primary/10 px-5 py-2.5 rounded-full border border-primary/20 text-sm font-bold text-primary">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Nerdiction Empfehlungen
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-5 py-2.5 rounded-full border text-sm font-medium">
            {currentMonth} Update
          </div>
          <div className="bg-muted/50 px-5 py-2.5 rounded-full border text-sm font-medium">
            Bestes Preis-Leistungs-Verhältnis
          </div>
          <div className="bg-muted/50 px-5 py-2.5 rounded-full border text-sm font-medium">
            {totalBuilds} Builds verfügbar
          </div>
        </div>
      </div>

      <GamingPCsTabs desktops={desktops as PCBuild[]} laptops={laptops as PCBuild[]} />

      {/* Info Section */}
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-muted/30 to-muted/10 p-8 md:p-12 rounded-3xl border-2 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
            Worauf wir bei unseren <span className="text-primary">Empfehlungen</span> achten
          </h2>
          <p className="text-muted-foreground">
            Unsere Auswahlkriterien für die besten Gaming-PCs und Laptops
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3 p-6 rounded-2xl bg-background/50 border hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-black text-xl">€</span>
              </div>
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">Preisleistung</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Wir wählen Komponenten, die für ihr Geld die maximale Performance liefern. Jeder Euro zählt.
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-2xl bg-background/50 border hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-black text-xl">🔄</span>
              </div>
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">Aktualität</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unsere Listen werden monatlich geprüft und bei Preisänderungen oder neuen Releases angepasst.
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-2xl bg-background/50 border hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-black text-xl">✓</span>
              </div>
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">Kompatibilität</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Alle Teile in einem Build passen garantiert zu 100% zusammen. Keine Überraschungen beim Zusammenbau.
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-2xl bg-background/50 border hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-black text-xl">⬆</span>
              </div>
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">Aufrüstbarkeit</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Wir achten darauf, dass du dein System auch in Zukunft einfach erweitern und upgraden kannst.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

