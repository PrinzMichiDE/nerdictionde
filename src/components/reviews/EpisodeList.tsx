"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "./ScoreBadge";
import { MonitorPlay } from "lucide-react";

interface Episode {
  id: string;
  season: number;
  episode: number;
  title?: string | null;
  score?: number | null;
  notes?: string | null;
  createdAt: string;
}

interface EpisodeListProps {
  reviewId: string;
  isEn?: boolean;
}

export function EpisodeList({ reviewId, isEn = false }: EpisodeListProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reviews/${reviewId}/episodes`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setEpisodes(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reviewId]);

  if (loading) return null;

  if (episodes.length === 0) return null;

  const bySeason = episodes.reduce<Record<number, Episode[]>>((acc, ep) => {
    if (!acc[ep.season]) acc[ep.season] = [];
    acc[ep.season].push(ep);
    return acc;
  }, {});

  const seasons = Object.keys(bySeason)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <section className="space-y-8 pt-10 border-t border-border" aria-label={isEn ? "Episode ratings" : "Folgen-Wertungen"}>
      <div className="border-b border-border pb-4">
        <span className="kicker text-primary inline-flex items-center gap-1.5">
          <MonitorPlay className="h-3.5 w-3.5" />
          {isEn ? "Series" : "Serien-Review"}
        </span>
        <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          {isEn ? "Episode Ratings" : "Folgen-Wertungen"}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {isEn
            ? "How each episode scored in our review."
            : "So wurden die einzelnen Folgen im Test bewertet."}
        </p>
      </div>

      <div className="space-y-8">
        {seasons.map((season) => (
          <div key={season}>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider h-5 px-2">
                {isEn ? "Season" : "Staffel"} {season}
              </Badge>
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>
            <ul className="divide-y divide-border border border-border rounded-md overflow-hidden">
              {bySeason[season]
                .sort((a, b) => a.episode - b.episode)
                .map((ep) => (
                  <li
                    key={ep.id}
                    className="flex items-start justify-between gap-4 px-4 py-3 bg-card"
                  >
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 tabular-nums">
                          E{ep.episode}
                        </span>
                        {ep.title && (
                          <span className="font-medium text-sm line-clamp-1">{ep.title}</span>
                        )}
                      </div>
                      {ep.notes && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {ep.notes.replace(/[#*`]/g, "").slice(0, 160)}
                          {ep.notes.replace(/[#*`]/g, "").length > 160 ? "…" : ""}
                        </p>
                      )}
                    </div>
                    {ep.score != null && (
                      <ScoreBadge score={ep.score} className="h-8 w-8 text-xs shrink-0" />
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
