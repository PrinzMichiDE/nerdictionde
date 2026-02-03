import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/pc-builder/components
 * Returns available components from published PC builds, grouped by type.
 */
export async function GET(req: NextRequest) {
  try {
    const builds = await prisma.pCBuild.findMany({
      where: { status: "published" },
      include: {
        components: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { pricePoint: "asc" },
    });

    const byType: Record<string, Array<{ id: string; name: string; type: string; manufacturer?: string | null; price?: number | null; specs?: unknown }>> = {};
    const seen = new Set<string>();

    for (const build of builds) {
      for (const comp of build.components) {
        const key = `${comp.type}-${comp.name}-${comp.manufacturer ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const type = comp.type || "Other";
        if (!byType[type]) byType[type] = [];
        byType[type].push({
          id: comp.id,
          name: comp.name,
          type: comp.type,
          manufacturer: comp.manufacturer,
          price: comp.price ?? undefined,
          specs: comp.specs ?? undefined,
        });
      }
    }

    const types = ["CPU", "GPU", "Motherboard", "RAM", "SSD", "PSU", "Case", "Cooler"];
    const components = types.map((type) => ({ type, items: byType[type] ?? [] }));

    return NextResponse.json({ components });
  } catch (error) {
    console.error("GET /api/pc-builder/components error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch components" },
      { status: 500 }
    );
  }
}
