/**
 * review-generation — Hardware processor
 *
 * End-to-end processing of a single hardware review: duplicate check, AI
 * content generation, image upload, SEO, DB creation and side effects.
 */

import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  uploadOfficialImage,
  uploadHardwareImages,
} from "./image-service";
import {
  ensureUniqueSlug,
  buildBaseSlug,
  formatHardwareType,
} from "./slug-service";
import {
  generateContent,
} from "./ai-client";
import {
  buildStructuredReviewPrompt,
  computeScoreBand,
} from "./prompt-builder";
import {
  generateSeoMetadataSafe,
  applyImagePlaceholders,
  createReviewInTransaction,
  runSideEffects,
  clampScore,
} from "./base-processor";
import type {
  HardwareData,
  ProcessOptions,
  ProcessResult,
  GeneratedReviewContent,
} from "./types";

/**
 * Builds context lines for the hardware review prompt.
 */
function buildHardwareContextLines(
  hardware: HardwareData,
  tavilyResults: unknown
): string[] {
  const extractedSpecs = tavilyResults as { price?: string; specs?: Record<string, unknown>; description?: string; rating?: number } | null;

  const lines: string[] = [
    `Produktname: ${hardware.name || "Unbekanntes Produkt"}`,
    hardware.manufacturer ? `Hersteller: ${hardware.manufacturer}` : "",
    hardware.model ? `Modell: ${hardware.model}` : "",
    `Kategorie: ${formatHardwareType(hardware.type || "hardware")}`,
    hardware.releaseDate
      ? `Erscheinungsdatum: ${new Date(hardware.releaseDate).toLocaleDateString("de-DE")}`
      : "",
    hardware.msrp ? `UVP / Straßenpreis: ${hardware.msrp} EUR` : "",
    extractedSpecs?.price ? `Recherchierter Preis: ${extractedSpecs.price}` : "",
    hardware.specs && typeof hardware.specs === "object"
      ? `Technische Daten (Hersteller): ${JSON.stringify(hardware.specs)}`
      : "",
    extractedSpecs?.specs && Object.keys(extractedSpecs.specs).length > 0
      ? `Technische Daten (Recherche): ${JSON.stringify(extractedSpecs.specs)}`
      : "",
    extractedSpecs?.description ? `Beschreibung: ${extractedSpecs.description}` : "",
  ];

  if (tavilyResults) {
    // Research summary would be appended here from tavily
  }

  return lines.filter(Boolean);
}

/**
 * Builds hardware metadata for storage.
 */
function buildHardwareMetadata(hardware: HardwareData): Record<string, unknown> {
  return {
    manufacturer: hardware.manufacturer || null,
    model: hardware.model || null,
    type: hardware.type || null,
    msrp: hardware.msrp ?? null,
    releaseDate: hardware.releaseDate || null,
  };
}

/**
 * Processes a single hardware item: generates a full review and persists it.
 */
export async function processHardware(
  hardwareData: HardwareData,
  options: ProcessOptions
): Promise<ProcessResult> {
  try {
    // 1. Duplicate check by hardwareId when available
    if (hardwareData.id) {
      const existingByHardware = await prisma.review.findFirst({
        where: { hardwareId: String(hardwareData.id) },
      });
      if (existingByHardware) {
        return { success: false, error: "Already exists" };
      }
    }

    // 2. Tavily research (best-effort)
    let tavilyResults: unknown;
    try {
      const { searchHardwareProduct } = await import("../tavily");
      tavilyResults = await searchHardwareProduct(
        hardwareData.name || "Unbekanntes Produkt",
        hardwareData.manufacturer || ""
      );
    } catch {
      // Non-blocking
    }

    // 3. Generate review content
    const reviewContent = await generateReviewContentForHardware(
      hardwareData,
      tavilyResults
    );

    // 4. Slug generation (deterministic)
    const baseName = reviewContent.de.title || hardwareData.name || "Unbenanntes Hardware";
    const baseSlug = buildBaseSlug(baseName, baseName);
    const slug = await ensureUniqueSlug(baseSlug);

    // 5. Upload images in parallel
    const [officialUrls, productUrls] = await Promise.all([
      uploadOfficialImage(hardwareData.image, slug),
      hardwareData.images && hardwareData.images.length > 0
        ? uploadHardwareImages(hardwareData.images, slug)
        : Promise.resolve<string[]>([]),
    ]);
    const imageUrls = [...officialUrls, ...productUrls];

    // 6. If no images yet, try Tavily for real product images
    let finalImageUrls = imageUrls;
    if (finalImageUrls.length === 0 && tavilyResults) {
      // Try to extract images from tavily results if available
      // (kept minimal — real image extraction would need tavily response parsing)
    }

    // 7. Replace image placeholders
    const { contentDe, contentEn } = applyImagePlaceholders(
      reviewContent.de.content,
      reviewContent.en.content,
      finalImageUrls,
      hardwareData.name || "Unbekanntes Produkt"
    );

    // 8. SEO metadata
    const { metaDescription, metaKeywords } = await generateSeoMetadataSafe(
      reviewContent.de.title,
      contentDe,
      "hardware"
    );

    // 9. Score
    const score = clampScore(reviewContent.score);

    // 10. Metadata
    const metadata = buildHardwareMetadata(hardwareData);
    const releaseDate = hardwareData.releaseDate
      ? new Date(hardwareData.releaseDate)
      : null;
    const specs = (reviewContent.specs || hardwareData.specs) as unknown;

    // 11. Create review in a transaction
    const review = await createReviewInTransaction({
      title: reviewContent.de.title,
      title_en: reviewContent.en.title,
      slug,
      category: "hardware",
      content: contentDe,
      content_en: contentEn,
      score,
      pros: reviewContent.de.pros,
      pros_en: reviewContent.en.pros,
      cons: reviewContent.de.cons,
      cons_en: reviewContent.en.cons,
      images: finalImageUrls,
      youtubeVideos: [],
      status: options.status,
      hardwareId: hardwareData.id ? String(hardwareData.id) : null,
      specs: specs as unknown as Prisma.InputJsonValue | undefined,
      metadata,
      metaDescription,
      metaKeywords,
      releaseDate: releaseDate ?? null,
      createdAt: releaseDate
        ? new Date(releaseDate.getTime() / 1000)
        : new Date(),
    });

    // 12. Side effects (non-blocking)
    await runSideEffects(review.id, {
      reviewTitle: reviewContent.de.title,
      score,
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "hardware",
      contentExcerpt: reviewContent.de.content.substring(0, 500),
      metadata: {
        manufacturer: hardwareData.manufacturer,
        type: formatHardwareType(hardwareData.type || "hardware"),
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error processing hardware ${hardwareData.name}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Generates review content for hardware, including Tavily research context.
 */
async function generateReviewContentForHardware(
  hardware: HardwareData,
  tavilyResults: unknown
): Promise<GeneratedReviewContent> {
  const extractedSpecs = tavilyResults as { price?: string; specs?: Record<string, unknown>; description?: string; rating?: number } | null;

  const contextLines = buildHardwareContextLines(hardware, extractedSpecs);

  const sections = [
    { de: "Einleitung", en: "Introduction", description: "Stimme den Leser ein: Worum geht es, warum ist das Produkt relevant, Einordnung in Markt und Kategorie." },
    { de: "Design & Verarbeitung", en: "Design & Build Quality", description: "Materialien, Haptik, Optik, RGB-Beleuchtung, Platzierung von Anschlüssen, Verarbeitungsqualität." },
    { de: "Leistung & Benchmarks", en: "Performance & Benchmarks", description: "Messbare Leistung, Vergleich mit Vorgänger und Konkurrenz, reale Anwendungsfälle (Gaming, Produktivität)." },
    { de: "Features & Konnektivität", en: "Features & Connectivity", description: "Schnittstellen, Software, Besonderheiten, mitgeliefertes Zubehör, Kompatibilität." },
    { de: "Preis & Leistung", en: "Price & Value", description: "Straßenpreis, Positionierung im Markt, Aufpreis gegenüber der Konkurrenz, Wann es sich lohnt." },
    { de: "Vergleich mit Alternativen", en: "Comparison with Alternatives", description: "Direkter Vergleich mit 2-3 Konkurrenten in der gleichen Preis- und Leistungsklasse." },
    { de: "Für wen lohnt sich das Produkt?", en: "Who Is This For?", description: "Zielgruppe, Anwendungsfall, Einsteiger vs. Enthusiast, Kaufempfehlung." },
    { de: "Fazit", en: "Verdict", description: "Gesamturteil, Begründung des Scores und klare Kaufempfehlung." },
  ];

  const referenceRatings: string[] = [];
  if (extractedSpecs?.rating) {
    referenceRatings.push(`Fachpresse/Community ca. ${extractedSpecs.rating}/10`);
  }

  const scoreBand = extractedSpecs?.rating
    ? computeScoreBand(extractedSpecs.rating)
    : undefined;

  const prompt = buildStructuredReviewPrompt({
    category: "hardware",
    itemName: hardware.name || "Unbekanntes Produkt",
    contextLines,
    sections,
    wordTarget: 1600,
    imageCount: 4,
    isRetry: false,
    includeSpecs: true,
    referenceRating: referenceRatings.join("; ") || undefined,
    scoreBand,
  });

  return generateContent(prompt, hardware.name || "Unbekanntes Produkt");
}
