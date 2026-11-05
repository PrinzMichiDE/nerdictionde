import prisma from "@/lib/prisma";

async function main() {
  console.log("🌱 Seeding wiki...");
  
  const wikiEntries = [
    {
      title: "FPS (Frames per Second)",
      slug: "fps-frames-per-second",
      excerpt: "Anzahl der Bilder, die pro Sekunde auf dem Bildschirm angezeigt werden",
      content: `# FPS (Frames per Second)

## Definition

FPS steht für "Frames per Second" (Bilder pro Sekunde) und gibt an, wie viele einzelne Bilder pro Sekunde von der Grafikkarte gerendert und auf dem Monitor angezeigt werden.

## Bedeutung für Gaming

- **30 FPS**: Spielbar, aber weniger flüssig
- **60 FPS**: Standard für die meisten Spiele, gilt als flüssig
- **120+ FPS**: Sehr flüssig, besonders für kompetitives Gaming
- **144+ FPS**: Optimal für 144Hz-Monitore

## Einflussfaktoren

Die FPS werden beeinflusst von:
- Grafikkarte (GPU)
- Prozessor (CPU)
- RAM
- Grafikeinstellungen im Spiel
- Auflösung

## FPS vs Hz

Der Monitor hat eine Bildwiederholrate in Hz (z.B. 144Hz). Um von höheren FPS zu profitieren, sollte die Bildwiederholrate des Monitors mit den FPS übereinstimmen oder höher sein.
`,
      type: "wiki",
      category: "gaming-begriffe",
      tags: ["FPS", "Framerate", "Bildrate"],
      difficulty: "beginner",
      status: "published",
    },
    {
      title: "Raytracing",
      slug: "raytracing",
      excerpt: "Raytracing simuliert das physikalisch korrekte Verhalten von Licht",
      content: `# Raytracing

## Was ist Raytracing?

Raytracing ist eine Rendering-Technik, die das Verhalten von Lichtstrahlen physikalisch korrekt simuliert. Anstatt Licht mit vereinfachten Tricks zu berechnen, verfolgt Raytracing den Weg einzelner Lichtstrahlen.

## Wie funktioniert es?

1. **Strahlenverfolgung**: Von der Kamera aus werden Strahlen in die Szene geschickt
2. **Kollisionserkennung**: Diese Strahlen kollidieren mit Objekten
3. **Lichtberechnung**: Reflexionen, Schatten und Brechungen werden berechnet
4. **Rendering**: Das finale Bild wird zusammengesetzt

## Vor- und Nachteile

### Vorteile
- Realistischere Beleuchtung und Schatten
- Natürliche Reflexionen
- Bessere globale Beleuchtung

### Nachteile
- Sehr rechenintensiv
- Höhere Hardware-Anforderungen
- Performance-Einbußen ohne Upscaling

## Raytracing in Spielen

Moderne Grafikkarten von NVIDIA (RTX) und AMD (RX 6000/7000 Serie) unterstützen Hardware-beschleunigtes Raytracing. Technologien wie DLSS und FSR helfen, die Performance-Einbußen auszugleichen.
`,
      type: "wiki",
      category: "gaming-begriffe",
      tags: ["Raytracing", "RTX", "Beleuchtung"],
      difficulty: "intermediate",
      status: "published",
    },
    {
      title: "DLSS vs FSR",
      slug: "dlss-vs-fsr",
      excerpt: "Vergleich der beiden Upscaling-Technologien",
      content: `# DLSS vs FSR

## Überblick

DLSS (Deep Learning Super Sampling) von NVIDIA und FSR (FidelityFX Super Resolution) von AMD sind beide Upscaling-Technologien, die die Performance verbessern, indem sie niedrigere Auflösungen rendern und dann hochskalieren.

## Direkter Vergleich

| Aspekt | DLSS | FSR |
| --- | --- | --- |
| **Anbieter** | NVIDIA | AMD |
| **Hardware-Anforderungen** | Nur RTX-Karten | Überwiegend breit unterstützt |
| **Qualität** | Meist besser, besonders bei DLSS 3 | Sehr gut, hat aufgeholt |
| **Verfügbarkeit** | Exklusiv für NVIDIA | Offener Standard, mehr Spiele unterstützen es |

## DLSS-Versionen

- **DLSS 1**: Erste Generation
- **DLSS 2**: Deutlich verbessert, weit verbreitet
- **DLSS 3**: Frame Generation für noch mehr FPS
- **DLSS 3.5**: Ray Reconstruction

## FSR-Versionen

- **FSR 1**: Erste Generation
- **FSR 2**: Deutlich verbessert, ähnelt DLSS 2
- **FSR 3**: Frame Generation

## Fazit

FSR ist für die meisten Nutzer die zugänglichere Wahl da es auf mehr Hardware funktioniert. DLSS bietet oft eine etwas bessere Bildqualität, wenn du entsprechende Hardware hast.
`,
      type: "wiki",
      category: "gaming-begriffe",
      tags: ["DLSS", "FSR", "Upscaling"],
      difficulty: "intermediate",
      status: "published",
    },
  ];

  for (const entry of wikiEntries) {
    await prisma.guide.upsert({
      where: { slug: entry.slug },
      update: entry,
      create: {
        ...entry,
        publishedAt: new Date(),
      },
    });
  }

  console.log(`✅ ${wikiEntries.length} Wiki-Einträge geseeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
