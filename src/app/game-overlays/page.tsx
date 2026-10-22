import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";
import prisma from "@/lib/prisma";
import { Gamepad2, ExternalLink, Copy, Sparkles } from "lucide-react";
import { GameOverlayCard } from "@/components/streaming/GameOverlayCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lizenzfreie Game-Overlays für OBS - Nerdiction",
  description:
    "Kostenlose, lizenzfreie Minispiele und animierte Overlays (CC0) als OBS-Browser-Quelle – Snake, Pong, Partikel-BRB & mehr.",
  alternates: { canonical: `${getSiteUrl()}/game-overlays` },
};

const CATEGORY_LABELS: Record<string, string> = {
  minigame: "Minispiele",
  animated: "Animationen",
  "chat-game": "Chat-Games",
  alert: "Alerts",
};

export default async function GameOverlaysPage() {
  const overlays = await prisma.gameOverlay.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "asc" },
  });

  const grouped = overlays.reduce<Record<string, typeof overlays>>((acc, o) => {
    (acc[o.category] ??= []).push(o);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      <section className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" /> CC0 · lizenzfrei
        </span>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          Game-Overlays für OBS
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Vollständig self-contained HTML-Overlays – keine externen Requests, keine
          Lizenzen. Einfach als Browser-Quelle in OBS einbinden. Perfekt für
          &quot;Be Right Back&quot;-Szenen oder Stream-Duelle.
        </p>
      </section>

      {overlays.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Noch keine Overlays hinterlegt. Seed via{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            POST /api/seed-game-overlays
          </code>
          .
        </p>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat} className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              {CATEGORY_LABELS[cat] ?? cat}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((o) => (
                <GameOverlayCard key={o.id} overlay={o} />
              ))}
            </div>
          </section>
        ))
      )}

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-2 flex items-center gap-2 font-semibold">
          <ExternalLink className="size-4 text-primary" /> So bindest du es in OBS ein
        </h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Klicke bei einem Overlay auf „OBS-URL kopieren&quot;.</li>
          <li>In OBS: Quelle → „Browser&quot; hinzufügen.</li>
          <li>URL einfügen, Breite/Höhe z. B. 1920×1080, „Benutzerdefinierte CSS&quot; leer lassen.</li>
          <li>Fertig – das Overlay läuft lokal im Browser ohne externe Abhängigkeiten.</li>
        </ol>
      </div>
    </div>
  );
}
