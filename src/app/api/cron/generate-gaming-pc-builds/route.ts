import { NextRequest, NextResponse } from "next/server";
import { generatePCBuild } from "@/lib/pc-build-generation";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/auth";

// Preiskategorien für Gaming PCs
const PRICE_POINTS = [300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1500, 1700, 2000, 2500, 3000, 3500, 4500];

/**
 * Cron Job: Generiert monatlich neue Gaming PC Setups für alle Preiskategorien
 * Läuft am 1. jedes Monats um 2:00 Uhr UTC
 * Kann auch manuell vom Admin-Bereich aufgerufen werden
 */
export async function GET(req: NextRequest) {
  try {
    // Check for authorization (Vercel Cron Secret OR Admin Auth)
    const authHeader = req.headers.get('authorization');
    const isCronAuth = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isAdminAuth = checkAdminAuth(req);
    
    if (!isCronAuth && !isAdminAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = {
      attempted: 0,
      successful: 0,
      failed: 0,
      updated: 0,
      builds: [] as Array<{ pricePoint: number; slug: string; status: string }>,
    };

    // Process each price point
    for (const pricePoint of PRICE_POINTS) {
      try {
        results.attempted++;

        // Check if a build already exists for this price point
        const existingBuild = await prisma.pCBuild.findUnique({
          where: { pricePoint },
        });

        // Generate new build
        const buildResult = await generatePCBuild(pricePoint);

        if (!buildResult.success || !buildResult.build) {
          results.failed++;
          console.error(`Failed to generate build for ${pricePoint}€:`, buildResult.error);
          continue;
        }

        const buildData = buildResult.build;

        if (existingBuild) {
          // Update existing build
          // First, delete old components
          await prisma.pCComponent.deleteMany({
            where: { pcBuildId: existingBuild.id },
          });

          // Check if slug already exists (shouldn't happen, but be safe)
          let finalSlug = buildData.slug;
          const slugExists = await prisma.pCBuild.findUnique({
            where: { slug: finalSlug },
          });
          
          if (slugExists && slugExists.id !== existingBuild.id) {
            // Append timestamp if slug conflict
            finalSlug = `${buildData.slug}-${Date.now()}`;
          }

          // Update build (keep same pricePoint and id, but update everything else)
          const updatedBuild = await prisma.pCBuild.update({
            where: { id: existingBuild.id },
            data: {
              title: buildData.title,
              slug: finalSlug, // Update slug with new month/year/timestamp
              description: buildData.description,
              totalPrice: buildData.totalPrice,
              status: buildData.status,
              updatedAt: new Date(),
              components: {
                create: buildData.components.map((comp: any) => ({
                  type: comp.type,
                  name: comp.name,
                  manufacturer: comp.manufacturer,
                  model: comp.model,
                  price: comp.price,
                  currency: comp.currency || "EUR",
                  specs: comp.specs,
                  sortOrder: comp.sortOrder,
                })),
              },
            },
            include: {
              components: true,
            },
          });

          results.updated++;
          results.builds.push({
            pricePoint: updatedBuild.pricePoint,
            slug: updatedBuild.slug,
            status: "updated",
          });

          console.log(`Updated build for ${pricePoint}€: ${updatedBuild.slug}`);
        } else {
          // Create new build
          const newBuild = await prisma.pCBuild.create({
            data: {
              pricePoint: buildData.pricePoint,
              title: buildData.title,
              slug: buildData.slug,
              description: buildData.description,
              totalPrice: buildData.totalPrice,
              currency: buildData.currency || "EUR",
              status: buildData.status,
              components: {
                create: buildData.components.map((comp: any) => ({
                  type: comp.type,
                  name: comp.name,
                  manufacturer: comp.manufacturer,
                  model: comp.model,
                  price: comp.price,
                  currency: comp.currency || "EUR",
                  specs: comp.specs,
                  sortOrder: comp.sortOrder,
                })),
              },
            },
            include: {
              components: true,
            },
          });

          results.successful++;
          results.builds.push({
            pricePoint: newBuild.pricePoint,
            slug: newBuild.slug,
            status: "created",
          });

          console.log(`Created build for ${pricePoint}€: ${newBuild.slug}`);
        }

        // Add delay between builds to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        results.failed++;
        console.error(`Error processing ${pricePoint}€ build:`, error);
      }
    }

    const totalProcessed = results.successful + results.updated;

    return NextResponse.json({
      message: `Gaming PC builds generation completed. ${totalProcessed} builds processed (${results.successful} created, ${results.updated} updated, ${results.failed} failed).`,
      results,
    });
  } catch (error: any) {
    console.error("Cron gaming PC builds generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

