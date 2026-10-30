/**
 * Nerdiction.de — Automatisierte Content-Pipeline API
 *
 * Endpoint: POST /api/content-pipeline
 * Body: { productName, category, sources?, priority? }
 *
 * Führt alle 5 Phasen der Pipeline aus (Ingestion → Fact-Check → Generation →
 * Rich Content → QA/Publishing) und gibt das Ergebnis zurück.
 */

import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/content-pipeline";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const { productName, category, sources, priority } = body;

    if (!productName || !category) {
      return NextResponse.json(
        { error: "productName und category sind erforderlich" },
        { status: 400 },
      );
    }

    const validCategories = ["game", "hardware", "movie", "series"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `category muss einer von ${validCategories.join(", ")} sein` },
        { status: 400 },
      );
    }

    const input = {
      productName: String(productName),
      category: category as "game" | "hardware" | "movie" | "series",
      sources: Array.isArray(sources) ? sources : [],
      priority: (priority ?? "normal") as "low" | "normal" | "high",
    };

    const result = await runPipeline(input);

    return NextResponse.json({
      success: true,
      ...result,
      message: result.published
        ? "Artikel automatisch veröffentlicht"
        : result.status === "blocked"
          ? "Artikel blockiert (Qualitäts-Schwellenwerte nicht erfüllt)"
          : "Artikel benötigt Überarbeitung",
    });
  } catch (error) {
    console.error("Content-Pipeline Fehler:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: "Nerdiction Content Pipeline",
    version: "1.0.0",
    phases: [
      "ingestion",
      "fact_check",
      "generation",
      "rich_content",
      "qa_publish",
    ],
    qualityThresholds: {
      factCheckScore: 95,
      seoScore: 90,
      readabilityScore: 60,
      maxPlagiatPercent: 5,
    },
    endpoint: "POST /api/content-pipeline",
  });
}
