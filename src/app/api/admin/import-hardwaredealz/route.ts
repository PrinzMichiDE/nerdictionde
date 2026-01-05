import { NextRequest, NextResponse } from "next/server";
import { scrapeHardwareDealz } from "@/lib/hardwaredealz-scraper";
import { requireAdminAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const builds = await scrapeHardwareDealz();
    return NextResponse.json(builds);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { builds } = body;

    if (!builds || !Array.isArray(builds)) {
      return NextResponse.json({ error: "Builds array is required" }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
    };

    for (const buildData of builds) {
      try {
        const slug = buildData.slug || `bester-${buildData.pricePoint}-euro-gaming-pc`;
        const totalPrice = buildData.components.reduce((acc: number, comp: any) => acc + comp.price, 0);

        // Find existing build by pricePoint
        const existingBuild = await prisma.pCBuild.findUnique({
          where: { pricePoint: buildData.pricePoint },
        });

        if (existingBuild) {
          // Update existing
          await prisma.pCComponent.deleteMany({
            where: { pcBuildId: existingBuild.id },
          });

          await prisma.pCBuild.update({
            where: { id: existingBuild.id },
            data: {
              title: buildData.title,
              description: buildData.description,
              totalPrice,
              updatedAt: new Date(),
              components: {
                create: buildData.components.map((comp: any, index: number) => ({
                  type: comp.type,
                  name: comp.name,
                  price: comp.price,
                  affiliateLink: comp.affiliateLink,
                  sortOrder: index,
                })),
              },
            },
          });
          results.updated++;
        } else {
          // Create new
          await prisma.pCBuild.create({
            data: {
              pricePoint: buildData.pricePoint,
              title: buildData.title,
              slug,
              description: buildData.description,
              totalPrice,
              status: "draft",
              components: {
                create: buildData.components.map((comp: any, index: number) => ({
                  type: comp.type,
                  name: comp.name,
                  price: comp.price,
                  affiliateLink: comp.affiliateLink,
                  sortOrder: index,
                })),
              },
            },
          });
          results.created++;
        }
      } catch (error) {
        console.error(`Failed to import build for ${buildData.pricePoint}€:`, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      message: `Import abgeschlossen. ${results.created} erstellt, ${results.updated} aktualisiert, ${results.failed} fehlgeschlagen.`,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

