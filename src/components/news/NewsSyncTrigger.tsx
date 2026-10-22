"use client";

import { useEffect } from "react";

/**
 * Feuert im Hintergrund einen News-Sync (Cooldown-gesteuert), damit die News
 * auch ohne stündlichen Cron-Job (Vercel Hobby-Limit) regelmäßig aktualisiert
 * werden. Läuft komplett im Hintergrund – beeinflusst das Rendering nicht.
 */
export function NewsSyncTrigger() {
  useEffect(() => {
    fetch("/api/news/refresh", { method: "GET", cache: "no-store" }).catch(() => {
      // Fehler beim Hintergrund-Sync ignorieren
    });
  }, []);

  return null;
}
