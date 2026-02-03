"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "./ScoreBadge";

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
}

export function EpisodeList({ reviewId }: EpisodeListProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reviews/${reviewId}/episodes`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setEpisodes)
      .finally(() => setLoading(false));
  }, [reviewId]);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground animate-pulse">
        Episoden werden geladen…
      </div>
    );
  }

  if (episodes.length === 0) {
    return null;
  }

  const bySeason = episodes.reduce<Record<number, Episode[]>>((acc, ep) => {
    if (!acc[ep.season]) acc[ep.season] = [];
    acc[ep.season].push(ep);
    return acc;
  }, {});

  const seasons = Object.keys(bySeason)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Episoden</h2>
      {seasons.map((season) => (
        <Card key={season} className="border-2">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">Staffel {season}</Badge>
            </h3>
            <ul className="space-y-3">
              {bySeason[season]
                .sort((a, b) => a.episode - b.episode)
                .map((ep) => (
                  <li
                    key={ep.id}
                    className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3"
                  >
                    <div>
                      <span className="font-medium text-muted-foreground">
                        E{ep.episode}
                        {ep.title ? ` · ${ep.title}` : ""}
                      </span>
                      {ep.notes && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {ep.notes.replace(/[#*`]/g, "").slice(0, 120)}…
                        </p>
                      )}
                    </div>
                    {ep.score != null && (
                      <ScoreBadge score={ep.score} className="h-8 w-8 text-xs shrink-0" />
                    )}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
