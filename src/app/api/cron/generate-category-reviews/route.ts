import { NextRequest, NextResponse } from "next/server";
import { processAmazonProduct } from "@/lib/review-generation";
import { processHardware } from "@/app/api/reviews/bulk-create-hardware/route";
import prisma from "@/lib/prisma";

/**
 * Cron Job: Generates one review from each category daily
 * Categories: hardware, amazon (using Tavily Search)
 * Schedule: Daily at midnight (0 0 * * *)
 */
export async function GET(req: NextRequest) {
  try {
    // No authorization required - API can be called publicly
    // Note: For production, consider adding rate limiting or authentication

    const results = {
      hardware: { success: false, reviewId: null as string | null, error: null as string | null },
      amazon: { success: false, reviewId: null as string | null, error: null as string | null },
    };

    // 2. Generate Hardware Review
    try {
      console.log("💻 Generating hardware review...");
      
      // Get a list of popular hardware items to choose from
      // Generate multiple reviews per day to compensate for daily schedule
      const popularHardware = [
        "NVIDIA RTX 4090",
        "AMD Ryzen 9 7950X",
        "Intel Core i9-14900K",
        "ASUS ROG Strix RTX 4080",
        "Samsung Odyssey G9",
        "Logitech MX Master 3S",
        "Corsair K70 RGB TKL",
        "SteelSeries Arctis Nova Pro",
        "PlayStation 5",
        "Xbox Series X",
        "AMD Ryzen 7 7800X3D",
        "NVIDIA RTX 4070",
        "Logitech G Pro X Superlight",
        "Keychron Q1",
        "HyperX Cloud Alpha",
      ];

      // Check which hardware items already have reviews
      const existingHardwareReviews = await prisma.review.findMany({
        where: {
          category: "hardware",
        },
        include: {
          hardware: true,
        },
      });

      const existingHardwareNames = new Set(
        existingHardwareReviews
          .map((r: { hardware: { name: string } | null }) => r.hardware?.name)
          .filter(Boolean)
      );

      // Find multiple hardware items without reviews (generate up to 3 per day)
      const hardwareToReview = popularHardware
        .filter((name) => !existingHardwareNames.has(name))
        .slice(0, 3);

      if (hardwareToReview.length > 0) {
        let successCount = 0;
        for (const hardwareName of hardwareToReview) {
          const result = await processHardware(hardwareName, {
            status: "published",
            skipExisting: true,
            generateImages: true,
          });

          if (result.success && result.reviewId) {
            successCount++;
            console.log(`✅ Hardware review created: ${hardwareName}`);
            // Update results with first successful review ID
            if (!results.hardware.success) {
              results.hardware.success = true;
              results.hardware.reviewId = result.reviewId;
            }
          } else {
            console.error(`❌ Failed to create hardware review for ${hardwareName}: ${result.error}`);
          }
        }
        if (successCount === 0) {
          results.hardware.error = "Failed to create any hardware reviews";
        } else {
          console.log(`✅ Created ${successCount} hardware review(s)`);
        }
      } else {
        // Try to get a random hardware item from database
        const randomHardware = await prisma.hardware.findFirst({
          where: {
            reviews: {
              none: {},
            },
          },
        });

        if (randomHardware) {
          const result = await processHardware(randomHardware.name, {
            status: "published",
            skipExisting: true,
            generateImages: true,
          });

          if (result.success && result.reviewId) {
            results.hardware.success = true;
            results.hardware.reviewId = result.reviewId;
            console.log(`✅ Hardware review created: ${randomHardware.name}`);
          } else {
            results.hardware.error = result.error || "Unknown error";
          }
        } else {
          results.hardware.error = "No hardware available for review";
          console.log("⚠️  No hardware available for review");
        }
      }
    } catch (error: any) {
      results.hardware.error = error.message;
      console.error("Error generating hardware review:", error);
    }

    // 3. Generate Amazon Review
    try {
      console.log("🛒 Generating Amazon review...");
      
      // Popular Amazon products to review
      // Generate multiple reviews per day to compensate for daily schedule
      const popularAmazonProducts = [
        { name: "Echo Dot (5. Generation)", asin: "B09B8V1LZ3" },
        { name: "Fire TV Stick 4K", asin: "B08C1W5N87" },
        { name: "Kindle Paperwhite", asin: "B08KTZ8249" },
        { name: "Ring Video Doorbell", asin: "B08N5NQ869" },
        { name: "Blink Outdoor Camera", asin: "B08FM85V85" },
        { name: "Echo Show 8", asin: "B09B8V1LZ4" },
        { name: "Fire TV Cube", asin: "B07K89FL5Y" },
        { name: "Ring Floodlight Cam", asin: "B08N5NQ870" },
        { name: "Kindle Oasis", asin: "B07L5GQYYM" },
        { name: "Echo Studio", asin: "B07N9Z9K5P" },
      ];

      // Check which products already have reviews
      const existingAmazonReviews = await prisma.review.findMany({
        where: {
          category: "amazon",
        },
        select: {
          amazonAsin: true,
        },
      });

      const existingAsins = new Set(
        existingAmazonReviews.map((r: { amazonAsin: string | null }) => r.amazonAsin).filter(Boolean)
      );

      // Find multiple products without reviews (generate up to 3 per day)
      const productsToReview = popularAmazonProducts
        .filter((p) => !existingAsins.has(p.asin))
        .slice(0, 3);

      if (productsToReview.length > 0) {
        let successCount = 0;
        for (const product of productsToReview) {
          const result = await processAmazonProduct(
            {
              name: product.name,
              asin: product.asin,
            },
            {
              status: "published",
              skipExisting: true,
              generateImages: true,
            }
          );

          if (result.success && result.reviewId) {
            successCount++;
            console.log(`✅ Amazon review created: ${product.name}`);
            // Update results with first successful review ID
            if (!results.amazon.success) {
              results.amazon.success = true;
              results.amazon.reviewId = result.reviewId;
            }
          } else {
            console.error(`❌ Failed to create Amazon review for ${product.name}: ${result.error}`);
          }
        }
        if (successCount === 0) {
          results.amazon.error = "Failed to create any Amazon reviews";
        } else {
          console.log(`✅ Created ${successCount} Amazon review(s)`);
        }
      } else {
        results.amazon.error = "No Amazon products available for review";
        console.log("⚠️  No Amazon products available for review");
      }
    } catch (error: any) {
      results.amazon.error = error.message;
      console.error("Error generating Amazon review:", error);
    }

    const totalSuccessful = Object.values(results).filter((r) => r.success).length;

    return NextResponse.json({
      message: `Category review generation completed. ${totalSuccessful}/2 categories successful (hardware, amazon).`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron category review generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
