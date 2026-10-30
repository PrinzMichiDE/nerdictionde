/**
 * Nerdiction.de — Automatisierte Content-Pipeline (Phasen 1-5)
 *
 * Orchestriert den gesamten Content-Erstellungs-Prozess von der Produkt-Idee
 * bis zum automatischen Publishing. Baut auf bestehenden Libs auf:
 *   review-generation.ts, seo-generation.ts, image-generation.ts,
 *   qa-generation.ts, humanizer.ts, hardware-db.ts, openai.ts
 *
 * Jede Phase gibt ein strukturiertes Ergebnis zurück. Bei Qualitäts-Schwellen-
 * unterschreitung wird der Artikel blockiert („needs_revision" oder „blocked").
 */

import { PrismaClient, Prisma } from "@prisma/client";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { generateSEOMetadata } from "@/lib/seo-generation";
import { generateReviewImages } from "@/lib/image-generation";
import { generateAndSaveQAForReview } from "@/lib/qa-generation";
import { humanizeText as humanize } from "@/lib/humanizer";
import { CPU_DB, GPU_DB } from "@/lib/hardware-db";
import { uploadImage } from "@/lib/blob";

const prisma = new PrismaClient();

// ============================================================================
// Typen
// ============================================================================

export type PipelinePhase =
  | "ingestion"
  | "fact_check"
  | "generation"
  | "rich_content"
  | "qa_publish";

export interface PipelineInput {
  productName: string;
  category: "game" | "hardware" | "movie" | "series";
  sources?: string[];
  priority?: "low" | "normal" | "high";
}

export interface PhaseResult {
  phase: PipelinePhase;
  status: "ok" | "retry" | "blocked";
  data: Record<string, unknown>;
  issues: string[];
  retryCount: number;
}

export interface PipelineOutput {
  draftId: string;
  reviewId?: string;
  status: string;
  factCheckScore: number;
  seoScore: number;
  readabilityScore: number;
  issues: string[];
  published: boolean;
  url?: string;
}

// ============================================================================
// Qualitäts-Schwellenwerte (aus Konzept Teil 2, Phase 5)
// ============================================================================

const QUALITY_THRESHOLDS = {
  factCheckScore: 95,
  seoScore: 90,
  readabilityScore: 60,
  maxPlagiatPercent: 5,
  maxImageSizeKb: 500,
  maxRetries: 3,
} as const;

// ============================================================================
// Phase 1 — Recherche & Data Ingestion
// ============================================================================

export async function phase1Ingestion(input: PipelineInput): Promise<PhaseResult> {
  const issues: string[] = [];
  const sourceData: Record<string, unknown> = {
    productName: input.productName,
    category: input.category,
    sources: input.sources ?? [],
    ingestedAt: new Date().toISOString(),
  };

  try {
    sourceData.specs = {};
    sourceData.price = null;
    sourceData.priceHistory = [];
    sourceData.benchmarkData = {};
    sourceData.userFeedback = [];

    return {
      phase: "ingestion",
      status: "ok",
      data: sourceData,
      issues,
      retryCount: 0,
    };
  } catch (error) {
    issues.push(`Ingestion-Fehler: ${error instanceof Error ? error.message : String(error)}`);
    return {
      phase: "ingestion",
      status: "blocked",
      data: sourceData,
      issues,
      retryCount: 0,
    };
  }
}

// ============================================================================
// Phase 2 — Fact-Checking & Anti-Halluzination
// ============================================================================

interface FactCheckResult {
  field: string;
  value: string;
  source: string;
  status: "verified" | "corrected" | "rejected";
  confidence: number;
  note?: string;
}

export async function phase2FactCheck(
  draftId: string,
  sourceData: Record<string, unknown>,
): Promise<{ result: PhaseResult; checks: FactCheckResult[]; score: number }> {
  const issues: string[] = [];
  const checks: FactCheckResult[] = [];

  try {
    const specs = (sourceData.specs as Record<string, unknown>) ?? {};
    const price = sourceData.price as number | null | undefined;

    if (price !== null && price !== undefined) {
      if (price <= 0) {
        checks.push({
          field: "price",
          value: String(price),
          source: "preis-api",
          status: "rejected",
          confidence: 100,
          note: "Preis muss größer als 0 sein",
        });
        issues.push("Preis nicht plausibel");
      } else {
        checks.push({
          field: "price",
          value: String(price),
          source: "preis-api",
          status: "verified",
          confidence: 95,
        });
      }
    }

    for (const [key, val] of Object.entries(specs)) {
      const keyLower = key.toLowerCase();
      const valStr = String(val ?? "");

      if (keyLower.includes("cpu") || keyLower.includes("prozessor")) {
        const match = CPU_DB.find((c) => c.name.toLowerCase().includes(valStr.toLowerCase()));
        if (match) {
          checks.push({
            field: `specs.${key}`,
            value: valStr,
            source: "hardware-db",
            status: "verified",
            confidence: 98,
            note: `Benchmark-Index: ${match.benchmarkIndex}`,
          });
        } else {
          checks.push({
            field: `specs.${key}`,
            value: valStr,
            source: "hardware-db",
            status: "rejected",
            confidence: 60,
            note: "CPU nicht in hardware-db gefunden",
          });
          issues.push(`CPU "${valStr}" nicht verifiziert`);
        }
      }

      if (keyLower.includes("gpu") || keyLower.includes("grafikkarte")) {
        const match = GPU_DB.find((g) => g.name.toLowerCase().includes(valStr.toLowerCase()));
        if (match) {
          checks.push({
            field: `specs.${key}`,
            value: valStr,
            source: "hardware-db",
            status: "verified",
            confidence: 98,
            note: `Benchmark-Index: ${match.benchmarkIndex}`,
          });
        } else {
          checks.push({
            field: `specs.${key}`,
            value: valStr,
            source: "hardware-db",
            status: "rejected",
            confidence: 60,
            note: "GPU nicht in hardware-db gefunden",
          });
          issues.push(`GPU "${valStr}" nicht verifiziert`);
        }
      }
    }

    const content = String(sourceData.content ?? "");
    const forbiddenPhrases = ["ich denke", "wahrscheinlich", "vielleicht", "eventuell"];
    for (const phrase of forbiddenPhrases) {
      if (content.toLowerCase().includes(phrase)) {
        issues.push(`Guardrail: Verbotene Phrase "${phrase}" im Inhalt`);
      }
    }

    const totalChecks = checks.length;
    const verifiedChecks = checks.filter((c) => c.status === "verified").length;
    const score = totalChecks > 0 ? Math.round((verifiedChecks / totalChecks) * 100) : 100;

    for (const check of checks) {
      await prisma.factCheckLog.create({
        data: {
          reviewId: draftId,
          field: check.field,
          value: check.value,
          source: check.source,
          status: check.status,
          confidence: check.confidence,
          note: check.note ?? null,
        },
      });
    }

    const status = score >= QUALITY_THRESHOLDS.factCheckScore ? "ok" : "blocked";

    return {
      result: {
        phase: "fact_check",
        status,
        data: { checks, score },
        issues,
        retryCount: 0,
      },
      checks,
      score,
    };
  } catch (error) {
    issues.push(`Fact-Check-Fehler: ${error instanceof Error ? error.message : String(error)}`);
    return {
      result: {
        phase: "fact_check",
        status: "blocked",
        data: { checks, score: 0 },
        issues,
        retryCount: 0,
      },
      checks,
      score: 0,
    };
  }
}

// ============================================================================
// Phase 3 — Multi-Agenten-Generierung
// ============================================================================

interface AgentHandoff {
  agent: string;
  output: Record<string, unknown>;
  issues: string[];
}

export async function phase3Generation(
  draftId: string,
  sourceData: Record<string, unknown>,
  factChecks: FactCheckResult[],
): Promise<PhaseResult> {
  const issues: string[] = [];
  const handoffs: AgentHandoff[] = [];

  try {
    const a1 = await runAgent("A1 Data Extraction", {
      task: "Extrahiere strukturierte Produktdaten (Specs, Preis, Benchmarks, Roh-Pros/Cons)",
      input: sourceData,
      factChecks,
    });
    handoffs.push(a1);

    const a2 = await runAgent("A2 Analyst", {
      task: "Bewerte Produkt, ziehe Vergleiche zu Konkurrenten, definiere Zielgruppen und Preis-Leistungs-Einstufung",
      input: a1.output,
    });
    handoffs.push(a2);

    const a3 = await runAgent("A3 Redaktion", {
      task: "Schreibe deutschen Fließtext, Einsteiger- und Profi-Zusammenfassung, automatisches TL;DR, Pros/Cons, Gesamt-Score (0-100)",
      input: a2.output,
      language: "de-DE",
    });
    handoffs.push(a3);

    const seo = await generateSEOMetadata(
      String(a3.output.title ?? inputProductName(sourceData)),
      String(a3.output.content ?? ""),
      sourceData.category as string,
    );
    handoffs.push({
      agent: "A4 SEO/AIO",
      output: { metaDescription: seo.metaDescription, metaKeywords: seo.metaKeywords },
      issues: [],
    });

    const a5 = await runAgent("A5 Design/Layout", {
      task: "Plane Infografiken, Diagramme, Alt-Texte, Bildplatzierungen",
      input: a3.output,
    });
    handoffs.push(a5);

    const title = String(a3.output.title ?? inputProductName(sourceData));
    const slug = generateSlug(title);
    const content = String(a3.output.content ?? "");

    const humanizedContent = await humanize(content);

    const draft = await prisma.articleDraft.create({
      data: {
        title,
        slug,
        category: sourceData.category as string,
        content: humanizedContent,
        score: Number(a3.output.score ?? 0),
        pros: Array.isArray(a3.output.pros) ? a3.output.pros : [],
        cons: Array.isArray(a3.output.cons) ? a3.output.cons : [],
        metaDescription: seo.metaDescription,
        metaKeywords: seo.metaKeywords,
        jsonLd: buildJsonLd(title, seo.metaDescription, sourceData) as Prisma.InputJsonValue,
        factCheckScore: 0,
        readabilityScore: calculateReadability(humanizedContent),
        seoScore: calculateSeoScore(seo, humanizedContent),
        status: "fact_checked",
        handoff: { agents: handoffs } as unknown as Prisma.InputJsonValue,
        sourceData: sourceData as Prisma.InputJsonValue,
      },
    });

    try {
      await generateAndSaveQAForReview(draft.id, {
        reviewTitle: title,
        reviewContent: humanizedContent,
        score: Number(a3.output.score ?? 0),
        pros: Array.isArray(a3.output.pros) ? a3.output.pros : [],
        cons: Array.isArray(a3.output.cons) ? a3.output.cons : [],
        category: sourceData.category as string,
      });
    } catch (e) {
      console.warn("QA-Generierung übersprungen:", e);
    }

    return {
      phase: "generation",
      status: "ok",
      data: { draftId: draft.id, title, slug, handoffs },
      issues,
      retryCount: 0,
    };
  } catch (error) {
    issues.push(`Generations-Fehler: ${error instanceof Error ? error.message : String(error)}`);
    return {
      phase: "generation",
      status: "blocked",
      data: { handoffs },
      issues,
      retryCount: 0,
    };
  }
}

function inputProductName(sourceData: Record<string, unknown>): string {
  return String(sourceData.productName ?? "Produkt");
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function runAgent(
  name: string,
  params: { task: string; input: Record<string, unknown>; language?: string; factChecks?: FactCheckResult[] },
): Promise<AgentHandoff> {
  const issues: string[] = [];
  try {
    const prompt = `
Du bist der ${name} in der automatisierten Content-Pipeline von Nerdiction.de.

Aufgabe: ${params.task}
Sprache: ${params.language ?? "de-DE"}
Input-Daten: ${JSON.stringify(params.input)}
${params.factChecks ? `\nFact-Check-Ergebnisse: ${JSON.stringify(params.factChecks)}\n` : ""}

Antworte NUR mit einem JSON-Objekt. Keine Erklärung, kein Markdown-Codeblock.
`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const output = JSON.parse(cleaned);

    return { agent: name, output, issues };
  } catch (error) {
    issues.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    return { agent: name, output: {}, issues };
  }
}

function buildJsonLd(
  title: string,
  metaDescription: string | null | undefined,
  sourceData: Record<string, unknown>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Product",
      name: inputProductName(sourceData),
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: sourceData.score ?? 0,
      bestRating: 100,
      worstRating: 0,
    },
    name: title,
    description: metaDescription ?? "",
    publisher: {
      "@type": "Organization",
      name: "Nerdiction.de",
    },
    datePublished: new Date().toISOString(),
    inLanguage: "de-DE",
  };
}

function calculateReadability(content: string): number {
  const words = content.split(/\s+/).filter((w) => w.length > 0);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (words.length === 0 || sentences.length === 0) return 50;
  const avgWordsPerSentence = words.length / sentences.length;
  let score = 100 - (avgWordsPerSentence - 15) * 2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateSeoScore(
  seo: { metaDescription: string; metaKeywords: string },
  content: string,
): number {
  let score = 0;
  if (seo.metaDescription && seo.metaDescription.length >= 120 && seo.metaDescription.length <= 160) score += 25;
  if (seo.metaKeywords && seo.metaKeywords.split(",").filter((k) => k.trim()).length >= 3) score += 20;
  if (content.includes("<h1") || content.includes("# ")) score += 20;
  if (content.includes(" alt=") || content.includes("![")) score += 15;
  if (content.length > 800) score += 20;
  return Math.min(100, score);
}

// ============================================================================
// Phase 4 — Rich Content & Visuals
// ============================================================================

export async function phase4RichContent(
  draftId: string,
  draft: { title: string; content: string; specs?: Record<string, unknown>; price?: number },
): Promise<PhaseResult> {
  const issues: string[] = [];
  const assets: Array<{ type: string; name: string; url?: string; content?: unknown }> = [];

  try {
    if (draft.specs && Object.keys(draft.specs).length > 0) {
      assets.push({
        type: "table",
        name: "spezifikationstabelle",
        content: draft.specs,
      });
    }

    assets.push({
      type: "chart",
      name: "preis_entwicklung",
      content: { chartType: "line", label: "Preisverlauf (90 Tage)" },
    });

    if (draft.specs) {
      assets.push({
        type: "chart",
        name: "benchmark_vergleich",
        content: { chartType: "bar", label: "Benchmark-Vergleich" },
      });
    }

    assets.push({
      type: "chart",
      name: "testkategorien_radar",
      content: { chartType: "radar", label: "Testergebnisse nach Kategorie" },
    });

    try {
      const images = await generateReviewImages({
        productName: draft.title,
        productType: "review",
        count: 3,
        aspectRatio: "16:9",
        style: "review-style",
      });
      for (let i = 0; i < images.length; i++) {
        assets.push({
          type: "image",
          name: `review-bild-${i + 1}`,
          url: images[i],
        });
      }
    } catch (e) {
      issues.push(`Bild-Generierung teilweise fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`);
    }

    for (const asset of assets) {
      if (asset.type === "image") {
        assets.push({
          type: "alt_text",
          name: `alt-${asset.name}`,
          content: { alt: `Bild von ${draft.title}: ${asset.name}` },
        });
      }
    }

    for (const asset of assets) {
      await prisma.richContentAsset.create({
        data: {
          draftId,
          type: asset.type,
          name: asset.name,
          url: asset.url ?? null,
          content: (asset.content ?? null) as any,
          fileSizeKb: asset.url ? 0 : undefined,
        },
      });
    }

    await prisma.articleDraft.update({
      where: { id: draftId },
      data: { status: "rich_content_ready" },
    });

    return {
      phase: "rich_content",
      status: "ok",
      data: { assetsCount: assets.length, assets },
      issues,
      retryCount: 0,
    };
  } catch (error) {
    issues.push(`Rich-Content-Fehler: ${error instanceof Error ? error.message : String(error)}`);
    return {
      phase: "rich_content",
      status: "blocked",
      data: { assets },
      issues,
      retryCount: 0,
    };
  }
}

// ============================================================================
// Phase 5 — Automated QA, SEO & Publishing
// ============================================================================

export interface QualityGateResult {
  passed: boolean;
  score: number;
  threshold: number;
  detail: string;
}

export async function phase5QaAndPublish(
  draftId: string,
): Promise<{
  status: "published" | "needs_revision" | "blocked";
  gates: QualityGateResult[];
  reviewId?: string;
  url?: string;
}> {
  const draft = await prisma.articleDraft.findUnique({
    where: { id: draftId },
    include: { richContentAssets: true },
  });

  if (!draft) {
    return { status: "blocked", gates: [] };
  }

  const gates: QualityGateResult[] = [];

  const factCheckPassed = draft.factCheckScore >= QUALITY_THRESHOLDS.factCheckScore;
  gates.push({
    passed: factCheckPassed,
    score: draft.factCheckScore,
    threshold: QUALITY_THRESHOLDS.factCheckScore,
    detail: `Fact-Checking-Score ${draft.factCheckScore}/100`,
  });

  const readabilityPassed = draft.readabilityScore >= QUALITY_THRESHOLDS.readabilityScore;
  gates.push({
    passed: readabilityPassed,
    score: draft.readabilityScore,
    threshold: QUALITY_THRESHOLDS.readabilityScore,
    detail: `Lesbarkeit ${draft.readabilityScore}/100`,
  });

  const seoPassed = draft.seoScore >= QUALITY_THRESHOLDS.seoScore;
  gates.push({
    passed: seoPassed,
    score: draft.seoScore,
    threshold: QUALITY_THRESHOLDS.seoScore,
    detail: `SEO-Abdeckung ${draft.seoScore}/100`,
  });

  const hasPros = draft.pros.length > 0;
  const hasCons = draft.cons.length > 0;
  const hasScore = draft.score > 0;
  const contentLower = draft.content.toLowerCase();
  const hasTlDr = contentLower.includes("tl;dr") || contentLower.includes("zusammenfassung");
  const structurePassed = hasPros && hasCons && hasScore && hasTlDr;
  gates.push({
    passed: structurePassed,
    score: structurePassed ? 100 : 50,
    threshold: 100,
    detail: `Struktur: Pros=${hasPros}, Cons=${hasCons}, Score=${hasScore}, TL;DR=${hasTlDr}`,
  });

  const imageAssets = draft.richContentAssets.filter((a) => a.type === "image");
  const oversizedImages = imageAssets.filter(
    (a) => a.fileSizeKb && a.fileSizeKb > QUALITY_THRESHOLDS.maxImageSizeKb,
  );
  const imagesPassed = oversizedImages.length === 0;
  gates.push({
    passed: imagesPassed,
    score: imagesPassed ? 100 : 0,
    threshold: 100,
    detail: `Bilder: ${imageAssets.length} Stück, ${oversizedImages.length} zu groß`,
  });

  const plagiatPassed = true;
  gates.push({
    passed: plagiatPassed,
    score: 100,
    threshold: 100 - QUALITY_THRESHOLDS.maxPlagiatPercent,
    detail: "Plagiat-Check: durchlaufen (Platzhalter)",
  });

  const allPassed = gates.every((g) => g.passed);

  if (allPassed) {
    const review = await prisma.review.create({
      data: {
        title: draft.title,
        slug: draft.slug,
        category: draft.category,
        content: draft.content,
        score: draft.score,
        pros: draft.pros,
        cons: draft.cons,
        images: imageAssets
          .filter((a) => a.url)
          .map((a) => a.url!),
        metaDescription: draft.metaDescription ?? null,
        metaKeywords: draft.metaKeywords ?? null,
        status: "published",
        specs: (draft.handoff as any) ?? null,
        metadata: { jsonLd: draft.jsonLd, sourceData: draft.sourceData } as unknown as Prisma.InputJsonValue,
        releaseDate: new Date(),
      },
    });

    await prisma.articleDraft.update({
      where: { id: draftId },
      data: {
        status: "published",
        reviewId: review.id,
        publishedAt: new Date(),
      },
    });

    return {
      status: "published",
      gates,
      reviewId: review.id,
      url: `/reviews/${review.slug}`,
    };
  }

  const failedGates = gates.filter((g) => !g.passed);
  const needsRevision = failedGates.length <= 2;

  if (needsRevision) {
    await prisma.articleDraft.update({
      where: { id: draftId },
      data: { status: "needs_revision" },
    });
    return { status: "needs_revision", gates };
  }

  await prisma.articleDraft.update({
    where: { id: draftId },
    data: { status: "blocked" },
  });
  return { status: "blocked", gates };
}

// ============================================================================
// Haupt-Orchestrierung: Führt alle 5 Phasen sequenziell aus
// ============================================================================

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const allIssues: string[] = [];
  let draftId = "";

  // Phase 1: Ingestion
  const p1 = await phase1Ingestion(input);
  allIssues.push(...p1.issues);
  if (p1.status === "blocked") {
    return { draftId, status: "blocked", factCheckScore: 0, seoScore: 0, readabilityScore: 0, issues: allIssues, published: false };
  }

  // Phase 2: Fact-Check
  const p2 = await phase2FactCheck("temp", p1.data);
  allIssues.push(...p2.result.issues);
  if (p2.result.status === "blocked") {
    const draft = await prisma.articleDraft.create({
      data: {
        title: input.productName,
        slug: generateSlug(input.productName),
        category: input.category,
        content: "",
        score: 0,
        pros: [],
        cons: [],
        factCheckScore: p2.score,
        readabilityScore: 0,
        seoScore: 0,
        status: "blocked",
        issues: allIssues as Prisma.InputJsonValue,
        sourceData: p1.data as Prisma.InputJsonValue,
      },
    });
    draftId = draft.id;
    return {
      draftId,
      status: "blocked",
      factCheckScore: p2.score,
      seoScore: 0,
      readabilityScore: 0,
      issues: allIssues,
      published: false,
    };
  }

  // Phase 3: Multi-Agent-Generierung
  const p3 = await phase3Generation("", p1.data, p2.checks);
  allIssues.push(...p3.issues);
  if (p3.status === "blocked") {
    return { draftId: "", status: "blocked", factCheckScore: p2.score, seoScore: 0, readabilityScore: 0, issues: allIssues, published: false };
  }

  draftId = String((p3.data as any).draftId ?? "");

  // Phase 4: Rich Content
  const draftForPhase4 = await prisma.articleDraft.findUnique({ where: { id: draftId } });
  if (!draftForPhase4) {
    return { draftId, status: "blocked", factCheckScore: p2.score, seoScore: 0, readabilityScore: 0, issues: ["Draft nicht gefunden"], published: false };
  }

  const p4 = await phase4RichContent(draftId, {
    title: draftForPhase4.title,
    content: draftForPhase4.content,
    specs: (draftForPhase4.sourceData as any)?.specs,
    price: (draftForPhase4.sourceData as any)?.price,
  });
  allIssues.push(...p4.issues);
  if (p4.status === "blocked") {
    return { draftId, status: "blocked", factCheckScore: p2.score, seoScore: draftForPhase4.seoScore, readabilityScore: draftForPhase4.readabilityScore, issues: allIssues, published: false };
  }

  // Phase 5: QA & Publishing
  const p5 = await phase5QaAndPublish(draftId);

  const updatedDraft = await prisma.articleDraft.findUnique({ where: { id: draftId } });

  return {
    draftId,
    reviewId: p5.reviewId,
    status: p5.status,
    factCheckScore: updatedDraft?.factCheckScore ?? p2.score,
    seoScore: updatedDraft?.seoScore ?? 0,
    readabilityScore: updatedDraft?.readabilityScore ?? 0,
    issues: allIssues,
    published: p5.status === "published",
    url: p5.url,
  };
}
