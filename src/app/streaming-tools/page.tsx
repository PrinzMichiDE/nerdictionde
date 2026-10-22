import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";
import prisma from "@/lib/prisma";
import {
  Wand2,
  MessageSquareCode,
  BellRing,
  Timer,
  HeartHandshake,
  Gamepad2,
  ArrowRight,
} from "lucide-react";
import { GameOverlayCard } from "@/components/streaming/GameOverlayCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Streaming-Tools & OBS-Overlays - Nerdiction",
  description:
    "Kostenlose Tools für Streamer: lizenzfreie Game-Overlays, Overlay-Generator, Chat-Commands, Alert-Setup, Countdown & Donation-Tracker.",
  alternates: { canonical: `${getSiteUrl()}/streaming-tools` },
};

const TOOLS = [
  {
    href: "/streaming-tools/overlay-generator",
    icon: Wand2,
    title: "Overlay-Generator",
    desc: "BRB, Starting Soon, Alerts & Countdowns als transparente OBS-Overlays.",
  },
  {
    href: "/streaming-tools/chat-commands",
    icon: MessageSquareCode,
    title: "Chat-Commands",
    desc: "Verwalte !befehl-Antworten für deinen Chatbot – exportierbar.",
  },
  {
    href: "/streaming-tools/alerts-setup",
    icon: BellRing,
    title: "Alert-Setup",
    desc: "Follower/Sub-Alert-Boxen als Browser-Quelle generieren.",
  },
  {
    href: "/streaming-tools/countdown-timer",
    icon: Timer,
    title: "Countdown-Timer",
    desc: "Live-Countdown bis zum Stream-Start für OBS.",
  },
  {
    href: "/streaming-tools/donation-tracker",
    icon: HeartHandshake,
    title: "Donation-Tracker",
    desc: "Spenden-Box, die sich live im Stream aktualisiert.",
  },
];

export default async function StreamingToolsPage() {
  const overlays = await prisma.gameOverlay.findMany({
    where: { isPublic: true },
    orderBy: { downloads: "desc" },
    take: 3,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-12 pb-16">
      <section className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Gamepad2 className="size-3.5" /> Für Streamer
        </span>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          Streaming-Tools
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Alle Overlays sind self-contained HTML, transparent und lizenzfrei (CC0) –
          direkt als OBS-Browser-Quelle einbindbar, ohne externe Server.
        </p>
      </section>

      {/* Featured game overlays */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            Lizenzfreie Game-Overlays
          </h2>
          <Link
            href="/game-overlays"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Alle ansehen <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {overlays.map((o) => (
            <GameOverlayCard
              key={o.id}
              overlay={{
                id: o.id,
                name: o.name,
                slug: o.slug,
                category: o.category,
                description: o.description,
                license: o.license,
                downloads: o.downloads,
              }}
            />
          ))}
        </div>
      </section>

      {/* Tools grid */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Öffnen <ArrowRight className="size-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
