import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { processHardware } from "@/lib/review-generation";
import { HARDWARE_CATALOG, type HardwareCatalogItem } from "@/lib/hardware-catalog";
import { notifySubscribers } from "@/lib/webpush";

/**
 * Cron Job: Generates hardware reviews automatically from the curated catalog.
 * Each run processes up to `?limit=` products (default 3) that don't yet have a review.
 * Schedule: Daily at 5 AM (0 5 * * *) — defined in vercel.json
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("⚠️ Unauthorized cron job attempt (generate-product-reviews)");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = Number(req.nextUrl.searchParams.get("limit")) || 3;
    const results: Array<{ name: string; success: boolean; reviewId?: string; error?: string }> = [];

    // Seed / upsert catalog into the Hardware table so hardwareId stays stable
    const catalogToProcess: HardwareCatalogItem[] = [];
    for (const item of HARDWARE_CATALOG) {
      if (catalogToProcess.length >= limit) break;

      const existingHardware = await prisma.hardware.findFirst({
        where: { name: item.name, manufacturer: item.manufacturer },
      });

      let hardwareId = existingHardware?.id;

      if (!existingHardware) {
        const slugBase = `${item.manufacturer}-${item.model || item.name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        let slug = slugBase;
        let attempt = 0;
        while (await prisma.hardware.findUnique({ where: { slug } })) {
          attempt++;
          slug = `${slugBase}-${attempt}`;
        }
        const created = await prisma.hardware.create({
          data: {
            name: item.name,
            name_en: item.name,
            slug,
            type: item.type,
            manufacturer: item.manufacturer,
            model: item.model || null,
            specs: item.specs as Prisma.InputJsonValue,
            msrp: item.msrp ?? null,
            releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
          },
        });
        hardwareId = created.id;
      }

      // Skip if a review already exists for this hardware
      if (hardwareId) {
        const existingReview = await prisma.review.findFirst({
          where: { hardwareId, category: "hardware" },
        });
        if (existingReview) {
          results.push({ name: item.name, success: false, error: "Already exists" });
          continue;
        }
      }

      const hardware = await prisma.hardware.findUnique({ where: { id: hardwareId! } });
      if (hardware) catalogToProcess.push(item);
    }

    for (const item of catalogToProcess) {
      try {
        const hardware = await prisma.hardware.findFirst({
          where: { name: item.name, manufacturer: item.manufacturer },
        });
        if (!hardware) {
          results.push({ name: item.name, success: false, error: "Hardware not found" });
          continue;
        }

        const result = await processHardware(hardware, {
          status: "published",
          skipExisting: true,
        });

        if (result.success && result.reviewId) {
          results.push({ name: item.name, success: true, reviewId: result.reviewId });
          console.log(`✅ Hardware review created: ${item.name}`);
          const review = await prisma.review.findUnique({
            where: { id: result.reviewId },
            select: { slug: true, title: true },
          });
          if (review) {
            const sent = await notifySubscribers("hardware", {
              title: `Neuer Hardware-Test: ${item.name}`,
              body: "Wir haben ein neues Produkt getestet – jetzt auf Nerdiction lesen.",
              url: `/reviews/${review.slug}`,
            });
            if (sent > 0) console.log(`📲 Push an ${sent} Abonnenten gesendet`);
          }
        } else {
          results.push({ name: item.name, success: false, error: result.error || "Unknown error" });
        }
      } catch (error: any) {
        results.push({ name: item.name, success: false, error: error.message });
        console.error(`Error generating hardware review for ${item.name}:`, error);
      }

      // Delay to avoid rate limits (OpenAI + Tavily + image gen)
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const successful = results.filter((r) => r.success).length;
    const duration = (Date.now() - startTime) / 1000;

    return NextResponse.json(
      {
        success: true,
        status: 200,
        message: `Cron completed. ${successful}/${catalogToProcess.length} hardware reviews generated.`,
        duration: `${duration}s`,
        results,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Cron product review generation error:", error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
