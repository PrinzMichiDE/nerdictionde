/**
 * Berechnet das Veröffentlichungsdatum basierend auf dem Release-Datum.
 * - Wenn nach 2022 erschienen: 3-6 Tage nach Release.
 * - Sonst: Zufällig zwischen 01.01.2022 und heute.
 */
export function calculatePublicationDate(releaseDateTimestamp?: number): Date {
  const now = new Date();
  const startOf2023 = new Date("2023-01-01T00:00:00Z");
  const startOf2022 = new Date("2022-01-01T00:00:00Z");

  if (releaseDateTimestamp) {
    const releaseDate = new Date(releaseDateTimestamp * 1000);
    
    if (releaseDate >= startOf2023) {
      // 3-6 Tage nach Release
      const randomDays = Math.floor(Math.random() * 4) + 3; // 3, 4, 5 oder 6
      const pubDate = new Date(releaseDate.getTime() + randomDays * 24 * 60 * 60 * 1000);
      
      // Falls das Datum in der Zukunft liegt, nimm "jetzt"
      return pubDate > now ? now : pubDate;
    }
  }

  // Zufälliges Datum zwischen 01.01.2022 und jetzt
  const start = startOf2022.getTime();
  const end = now.getTime();
  return new Date(start + Math.random() * (end - start));
}

