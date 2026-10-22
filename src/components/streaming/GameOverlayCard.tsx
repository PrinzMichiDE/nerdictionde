"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

export interface GameOverlaySummary {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  license: string;
  downloads: number;
}

export function GameOverlayCard({ overlay }: { overlay: GameOverlaySummary }) {
  const [copied, setCopied] = useState(false);
  const embedUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/game-overlay/${overlay.slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(embedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50">
      {/* Live preview */}
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <iframe
          src={`/api/game-overlay/${overlay.slug}`}
          title={overlay.name}
          className="h-full w-full scale-[1.02] border-0"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
        <span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
          {overlay.license}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold leading-tight">{overlay.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {overlay.description}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <button
            onClick={copy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Kopiert!" : "OBS-URL kopieren"}
          </button>
          <a
            href={`/api/game-overlay/${overlay.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            <ExternalLink className="size-3.5" />
            Test
          </a>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {overlay.downloads}× eingebunden
        </p>
      </div>
    </div>
  );
}
