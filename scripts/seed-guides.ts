import prisma from "@/lib/prisma";

async function main() {
  console.log("🌱 Seeding guides...");
  
  const guides = [
    {
      title: "Gaming-PC kaufen 2025: Der ultimative Guide",
      slug: "gaming-pc-kaufen-2025-der-ultimative-guide",
      excerpt: "So findest du den perfekten Gaming-PC für dein Budget",
      content: `# Gaming-PC kaufen 2025: Der ultimative Guide

## Einleitung

Der Kauf eines Gaming-PCs kann überwältigend sein. Mit so vielen Komponenten, Marken und Preisklassen ist es schwer den Überblick zu behalten. In diesem Guide helfen wir dir, den perfekten Gaming-PC für dein Budget zu finden.

## Budget festlegen

Bevor du mit dem Kauf beginnst, solltest du dir ein realistisches Budget setzen:

- **Budget bis 600€**: Entry-Level für 1080p bei niedrigen Einstellungen
- **600€ - 900€**: Solide Mittelklasse für 1080p bei hohen Einstellungen
- **900€ - 1200€**: High-End für 1080p/1440p
- **Über 1200€**: Enthusiast für 4K Gaming

## Die wichtigsten Komponenten

### Prozessor (CPU)
Der CPU ist das Herzstück deines Systems...

### Grafikkarte (GPU)
Die Grafikkarte ist die wichtigste Komponente für Gaming...

### Arbeitsspeicher (RAM)
16GB RAM ist für moderne Spiele mittlerweile Standard...

### Speicher (SSD)
Eine schnelle NVMe SSD ist heute unverzichtbar...

## Kaufempfehlungen 2025

### Für 600-800€
...

### Für 800-1000€
...

## Tipps zum Kauf

1. Vergleiche Preise auf Geizhals.de
2. Achte auf Verfügbarkeit
3. Kauf Komponenten nicht einzeln wenn Bundles günstiger sind
4. Berücksichtige zukünftige Upgrades

## Fazit

Mit der richtigen Planung findest du den perfekten Gaming-PC für deine Bedürfnisse.
`,
      type: "guide",
      category: "gaming",
      tags: ["Gaming-PC", "Kaufberatung", "Budget", "Komponenten"],
      difficulty: "beginner",
      readingTime: 8,
      featured: true,
      status: "published",
    },
    {
      title: "Steam Deck Tipps & Tricks",
      slug: "steam-deck-tipps-tricks",
      excerpt: "Das Beste aus deinem Steam Deck herausholen",
      content: `# Steam Deck Tipps & Tricks

## Einleitung

Das Steam Deck ist ein unglaublich vielseitiges Gerät. Mit diesen Tipps holst du noch mehr aus deinem Handheld heraus.

## Erste Schritte

### Einstellungen optimieren
- **Bildwiederholrate**: Je nach Spiel zwischen 40-60 Hz wählen
- **TDP-Limit**: Für bessere Akkulaufzeit reduzieren
- **Helligkeit**: Anpassen für optimale Akkulaufzeit

## Performance-Tipps

### Für bessere Akkulaufzeit
1. V-Sync deaktivieren wenn nicht nötig
2. FPS-Limit setzen
3. Helligkeit reduzieren
4. WLAN/Bluetooth bei Bedarf deaktivieren

### Für bessere Performance
1. Höhere TDP erlauben wenn am Netzteil
2. Grafiktreiber aktuell halten
3. Hintergrundprozesse minimieren

## Nützliche Apps

- **Decky Loader**: Für zusätzliche Plugins
- **CryoUtilities**: Für erweiterte Speicher-Optimierung
- **EmuDeck**: Für Emulation

## Tipps & Tricks

- Verwende den Desktop-Modus für erweiterte Einstellungen
- Externe SSD über USB-C für mehr Speicher
- Cloud-Saves regelmäßig synchronisieren

## Fazit

Mit diesen Tipps wird dein Steam Deck noch angenehmer zu nutzen.
`,
      type: "guide",
      category: "gaming",
      tags: ["Steam Deck", "Tipps", "Tricks", "Optimierung"],
      difficulty: "beginner",
      readingTime: 6,
      featured: true,
      status: "published",
    },
    {
      title: "Monitor kaufen: IPS, OLED oder Mini-LED?",
      slug: "monitor-kaufen-ips-oled-oder-mini-led",
      excerpt: "Welcher Display-Typ passt zu dir?",
      content: `# Monitor kaufen: IPS, OLED oder Mini-LED?

## Einleitung

Die Wahl des richtigen Monitors hängt stark von deinem Nutzungsverhalten ab. Gaming, Arbeiten oder beides?

## Display-Technologien im Vergleich

### IPS (In-Plane Switching)
- **Vorteile**: Gute Farben, weite Blickwinkel, erschwinglich
- **Nachteile**: Schlechterer Kontrast, langsameres Response-Zeit im Vergleich zu VA
- **Am besten für**: Allround-Nutzung, Fotobearbeitung

### OLED
- **Vorteile**: Perfekter Schwarzwert, unglaublicher Kontrast, sehr schnelle Reaktionszeit
- **Nachteile**: Teurer, Risiko von Burn-in (bei statischen Inhalten)
- **Am besten für**: Gaming, Filme

### Mini-LED
- **Vorteile**: Sehr guter Kontrast, helle Bilder, keine Burn-in-Gefahr
- **Nachteile**: Teuer, oft höhere Preise
- **Am besten für**: HDR-Gaming, Mischbetrieb

## Kaufempfehlung nach Einsatzzweck

- **Nur Gaming**: OLED oder schnelles IPS
- **Nur Arbeit**: IPS mit guter Farbgenauigkeit
- **Gaming + Arbeit**: IPS oder Mini-LED
- **Filme & Serien**: OLED

## Wichtige Specs

- **Auflösung**: 1080p, 1440p oder 4K
- **Bildwiederholrate**: Mindestens 120Hz für Gaming
- **Reaktionszeit**: Unter 5ms
- **HDR**: Nice-to-have aber nicht kritisch

## Fazit

Für die meisten Gamer ist heute ein guter IPS-Monitor die beste Wahl. Wenn das Budget es zulässt, lohnt sich OLED.
`,
      type: "guide",
      category: "hardware",
      tags: ["Monitor", "IPS", "OLED", "Mini-LED", "Kaufberatung"],
      difficulty: "beginner",
      readingTime: 7,
      featured: false,
      status: "published",
    },
  ];

  for (const guide of guides) {
    await prisma.guide.upsert({
      where: { slug: guide.slug },
      update: guide,
      create: {
        ...guide,
        publishedAt: new Date(),
      },
    });
  }

  console.log(`✅ ${guides.length} Guides geseeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
