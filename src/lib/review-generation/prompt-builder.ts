/**
 * review-generation — Prompt builder
 *
 * Constructs structured, deep-dive review prompts for games, movies, series
 * and hardware. Pure functions, easy to unit-test in isolation.
 */

import type {
  ReviewCategory,
  ReviewSection,
  StructuredReviewPromptOptions,
} from "./types";
import { getRetryHint } from "./json-repair";

const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  game: "Game-Review",
  movie: "Film-Review",
  series: "Serien-Review",
  hardware: "Hardware-Review",
};

const GAME_CATEGORY_LABELS: Record<number, string> = {
  0: "Hauptspiel",
  1: "DLC / Add-on",
  2: "Erweiterung",
  3: "Bundle",
  4: "Standalone-Erweiterung",
  5: "Mod",
  6: "Episode",
  7: "Sammlung",
  8: "Mod",
  9: "Remake",
  10: "Remaster",
  11: "Expanded Game",
  12: "Port",
  13: "Fork",
  14: "Pack",
  15: "Update",
};

const AGE_RATING_LABELS: Record<number, string> = {
  1: "PEGI 3",
  2: "PEGI 7",
  3: "PEGI 12",
  4: "PEGI 16",
  5: "PEGI 18",
  6: "ESRB eC",
  7: "ESRB E",
  8: "ESRB E10+",
  9: "ESRB T",
  10: "ESRB M",
  11: "ESRB AO",
};

const HARDWARE_TYPE_LABELS: Record<string, string> = {
  gpu: "Grafikkarte",
  cpu: "Prozessor",
  motherboard: "Mainboard",
  ram: "Arbeitsspeicher",
  storage: "SSD / Festplatte",
  psu: "Netzteil",
  case: "Gehäuse",
  cooler: "Kühler",
  monitor: "Monitor",
  keyboard: "Tastatur",
  mouse: "Maus",
  headset: "Headset",
  controller: "Controller",
  console: "Konsole",
  smartphone: "Smartphone",
  headphone: "Kopfhörer",
  earbuds: "True Wireless Earbuds",
  speaker: "Lautsprecher",
  "robot-vacuum": "Saugroboter",
  smartwatch: "Smartwatch",
  "fitness-tracker": "Fitnessarmband",
  ev: "Elektromobil",
  drone: "Drohne",
  "3d-printer": "3D-Drucker",
  "smart-display": "Smart Display",
  "smart-hub": "Smart-Home-Hub",
  "smart-lighting": "Smart Lighting",
  thermostat: "Smart Thermostat",
  "video-doorbell": "Smart Video-Türklingel",
  "security-camera": "Smart Überwachungskamera",
  "smart-lock": "Smart Lock",
  "smart-blind": "Smart Rollladenmotor",
  sensor: "Smart Home Sensor",
  "smart-plug": "Smart Steckdose",
  scooter: "Elektro-Tretroller",
  ebike: "E-Bike",
  "action-camera": "Action Camera",
  "360-camera": "360° Kamera",
  "cycling-computer": "Fahrradcomputer",
  backpack: "Rucksack",
  "satellite-communicator": "Satellitenkommunikator",
  "cycling-shoes": "Fahrradschuhe",
  "cycling-helmet": "Fahrradhelm",
  "rear-light": "Rücklicht",
  "bike-computer": "Bike Computer",
  "heads-up-display": "HUD",
  "building-set": "Klemmbaustein-Set",
  tablet: "Tablet",
  laptop: "Laptop",
  "vr-headset": "VR-Headset",
  tv: "Fernseher",
  projector: "Beamer",
  "vacuum-cleaner": "Staubsauger",
  "air-purifier": "Luftreiniger",
  "smart-lighting-strip": "LED-Streifen",
  "coffee-machine": "Kaffeemaschine",
  "hair-dryer": "Haartrockner",
  epilator: "Epilierer",
  shaver: "Rasierer",
  "electric-toothbrush": "Elektrische Zahnbürste",
  powerbank: "Powerbank",
  "air-fryer": "Heißluftfritteuse",
  "smart-speaker": "Smart Speaker",
  "smart-thermostat": "Smart Thermostat",
  "cycling-accessories": "Fahrradzubehör",
  "outdoor-gear": "Outdoor-Ausrüstung",
  gadget: "Gadget",
};

/**
 * Maps a reference rating on a 0-10 scale to a 0-100 score band.
 * The band is centered on the reference and clamped to [0, 100].
 */
export function computeScoreBand(reference10: number): ScoreBand {
  const target = Math.round(reference10 * 10);
  return {
    min: Math.max(0, target - 8),
    max: Math.min(100, target + 8),
    target,
  };
}

export interface ScoreBand {
  min: number;
  max: number;
  target: number;
}

/**
 * Computes a plausible target score band from external reference ratings.
 * Returns null when no usable values are present.
 */
export function computeGameScoreBand(
  values: Array<number | null | undefined>
): ScoreBand | null {
  const valid = values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0
  );
  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  const target = Math.round(avg);
  return {
    target,
    min: Math.max(0, target - 8),
    max: Math.min(100, target + 8),
  };
}

/**
 * Formats time-to-beat seconds into a human-readable German string.
 */
export function formatTimeToBeat(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null;
  const hours = Math.round(seconds / 3600);
  if (hours < 1) return `${Math.round(seconds / 60)} Minuten`;
  return `${hours} Stunden`;
}

/**
 * Formats IGDB age ratings into a human-readable label list.
 */
export function formatAgeRating(
  ratings?: Array<{ category?: number; rating?: number }>
): string {
  if (!ratings || ratings.length === 0) return "";
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const r of ratings) {
    if (typeof r.rating !== "number") continue;
    const label = AGE_RATING_LABELS[r.rating] || `Altersfreigabe ${r.rating}`;
    if (!seen.has(label)) {
      seen.add(label);
      labels.push(label);
    }
  }
  return labels.join(", ");
}

/**
 * Formats a hardware type key into its German label.
 */
export function formatHardwareType(type: string): string {
  return HARDWARE_TYPE_LABELS[type] || "Hardware";
}

/**
 * Builds a structured, deep-dive review prompt.
 * Enforces consistent quality: TOC, deep sections with custom anchors,
 * image placeholders, honest scoring and full DE/EN parity.
 */
export function buildStructuredReviewPrompt(
  options: StructuredReviewPromptOptions
): string {
  const {
    category,
    itemName,
    contextLines,
    sections,
    wordTarget,
    imageCount,
    isRetry,
    includeSpecs,
    referenceRating,
    scoreBand,
  } = options;

  const categoryLabel = CATEGORY_LABELS[category];

  const retryHint = isRetry
    ? `HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Halte dich strikt an ca. ${wordTarget} Wörter pro Sprache, damit das JSON vollständig bleibt.`
    : "";

  const sectionList = sections
    .map((s, i) => `${i + 1}. "${s.de}" (EN: "${s.en}") – ${s.description}`)
    .join("\n");

  const placeholders = Array.from(
    { length: Math.min(imageCount, 4) },
    (_, i) => `![[IMAGE_${i + 1}]]`
  ).join(" ");

  const specsSchema = includeSpecs
    ? `,
  "specs": {
    "minimum": { "os": "", "cpu": "", "ram": "", "gpu": "", "dx": "", "storage": "" },
    "recommended": { "os": "", "cpu": "", "ram": "", "gpu": "", "dx": "", "storage": "" }
  }`
    : "";

  const scoreGuidance = referenceRating
    ? `Der Score (0-100) muss logisch aus Pros/Cons und Analyse ableitbar sein und in einem plausiblen Verhältnis zur externen Referenzbewertung stehen (${referenceRating}).`
    : `Der Score (0-100) muss logisch aus Pros/Cons und Analyse ableitbar sein.`;

  const bandGuidance = scoreBand
    ? ` Die externen Referenzbewertungen liegen im Mittel bei ${scoreBand.target}/100. Vergebe den Score so, dass er im Bereich ${scoreBand.min}–${scoreBand.max} liegt. Eine Abweichung um mehr als ±5 ist nur erlaubt, wenn deine qualitative Analyse dafür triftige Gründe liefert, die du im Fazit nachvollziehbar begründest.`
    : "";

  return `
Schreibe eine tiefgehende, professionelle und SEO-optimierte ${categoryLabel} für "${itemName}" auf der Website Nerdiction – in DEUTSCH UND ENGLISCH.

${retryHint}

STRUKTUR & TIEFE (QUALITÄTSANFORDERUNGEN):
1. Länge: Etwa ${wordTarget} Wörter pro Sprache. Vollständig ausformulierte Absätze, keine Stichpunkte im Fließtext, keine Platzhaltertexte.
2. Inhaltsverzeichnis: Beginne den Content mit "## Inhaltsverzeichnis" (DE) bzw. "## Table of Contents" (EN) und einer Liste mit Links zu allen Hauptabschnitten, die auf die Anker der Überschriften zeigen.
3. Überschriften: Nutze H2 für Hauptabschnitte und H3 für Unterabschnitte. Gib JEDER Überschrift einen expliziten, eindeutigen Anker im Format "{#slug}" (z. B. "## Story & Erzählung {#story-und-erzaehlung}") und verlinke im Inhaltsverzeichnis exakt auf diese Anker.
4. Abschnitte: Behandle die folgenden Abschnitte in genau dieser Reihenfolge und schreibe jeden Abschnitt SEHR ausführlich (mindestens 4-5 Absätze pro Hauptabschnitt):

${sectionList}

5. Bilder: Platziere an sinnvollen Stellen im Text die Platzhalter ${placeholders} (einzeln, als eigener Absatz). Verwende höchstens ${imageCount} verschiedene Platzhalter.
6. Vor- und Nachteile: Gib exakt 5 Pros und 5 Cons pro Sprache an. Sie müssen konkrete Details aus der Review widerspiegeln und dürfen nicht generisch oder austauschbar sein.
7. Score: ${scoreGuidance}${bandGuidance} Vergebe nicht automatisch 70-80 – differenziere ehrlich.
8. Tonfall: Begeistert, kompetent und objektiv, wie von einem erfahrenen Redakteur. Erwähne NIEMALS, dass der Text von einer KI, einem Sprachmodell oder automatisch generiert wurde.
9. DE/EN-Konsistenz: Die englische Version ist eine vollständige, hochwertige Übersetzung der deutschen Version mit identischer Struktur – keine Auslassungen, keine Zusammenfassungen.
10. FAKTENTREUE: Stütze dich in Handlungs- und Inhaltsabschnitten AUSSCHLIESSLICH auf die unten bereitgestellten Fakten (Zusammenfassung, Storyline, Steam-Daten, Recherche). Erfinde KEINE konkreten Handlungsdetails, Namen, Charaktere, Features, technischen Werte oder Ereignisse, die nicht belegt sind. Fehlen Details, formuliere bewusst allgemein statt zu spekulieren.
11. Format: Antworte AUSSCHLIESSLICH mit gültigem JSON – kein Markdown-Codeblock, kein Text außerhalb des JSON.

JSON-Schema:
{
  "de": {
    "title": "Aussagekräftiger Titel (max. 70 Zeichen, ohne überflüssige Zusätze)",
    "content": "Kompletter Markdown-Content mit Inhaltsverzeichnis, allen Abschnitten, Bild-Platzhaltern und Fazit",
    "pros": ["...", "...", "...", "...", "..."],
    "cons": ["...", "...", "...", "...", "..."]
  },
  "en": {
    "title": "...",
    "content": "...",
    "pros": [...],
    "cons": [...]
  },
  "score": 0-100${specsSchema}
}

FAKTEN UND KONTEXT (nur als Recherche-Basis verwenden, nicht wörtlich kopieren):
${contextLines.join("\n")}
`.trim();
}
