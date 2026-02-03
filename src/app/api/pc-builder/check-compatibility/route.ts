import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/pc-builder/check-compatibility
 * Body: { components: Array<{ type: string, id?: string }> }
 * Stub: returns no issues. Can be extended with real compatibility rules.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const components = Array.isArray(body.components) ? body.components : [];
    const issues: Array<{ type: string; message: string }> = [];

    if (components.length === 0) {
      return NextResponse.json({ compatible: true, issues: [] });
    }

    const types = new Set(components.map((c: { type?: string }) => c?.type).filter(Boolean));
    if (types.has("CPU") && !types.has("Motherboard")) {
      issues.push({ type: "Motherboard", message: "Motherboard wird für den Betrieb benötigt." });
    }
    if (types.has("GPU") && !types.has("PSU")) {
      issues.push({ type: "PSU", message: "Netzteil wird für die GPU empfohlen." });
    }

    return NextResponse.json({
      compatible: issues.length === 0,
      issues,
    });
  } catch (error) {
    console.error("POST /api/pc-builder/check-compatibility error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Check failed" },
      { status: 500 }
    );
  }
}
