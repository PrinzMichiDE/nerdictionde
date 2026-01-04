import { NextRequest, NextResponse } from "next/server";
import { createHardware, detectHardwareType, HardwareType } from "@/lib/hardware";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { uploadImage } from "@/lib/blob";
import prisma from "@/lib/prisma";
import { calculatePublicationDate } from "@/lib/date-utils";
import { repairJson, generateHardwareReviewContent } from "@/lib/review-generation";
import { searchAmazonHardware } from "@/lib/amazon-search";
import { generateReviewImages } from "@/lib/image-generation";

interface BulkCreateHardwareOptions {
  hardwareNames: string[]; // List of hardware names to create reviews for
  batchSize?: number;
  delayBetweenBatches?: number;
  status?: "draft" | "published";
  skipExisting?: boolean;
  generateImages?: boolean; // Whether to generate images using OpenAI
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Helper function to extract manufacturer and model from hardware name
function parseHardwareName(name: string): { manufacturer?: string; model?: string } {
  const parts = name.trim().split(/\s+/);
  
  // Common manufacturers
  const manufacturers = [
    "NVIDIA", "AMD", "Intel", "ASUS", "MSI", "Gigabyte", "EVGA", "Zotac", 
    "Sony", "Microsoft", "Nintendo", "Razer", "Logitech", "Corsair",
    "Samsung", "Western Digital", "Seagate", "Crucial", "Kingston",
    "Cooler Master", "Noctua", "be quiet!", "Fractal Design", "Lian Li"
  ];
  
  let manufacturer: string | undefined;
  let model: string | undefined;
  
  // Try to find manufacturer at the start
  for (const mfr of manufacturers) {
    if (name.toUpperCase().startsWith(mfr.toUpperCase())) {
      manufacturer = mfr;
      model = name.substring(mfr.length).trim();
      break;
    }
  }
  
  // If no manufacturer found, try common patterns
  if (!manufacturer) {
    // RTX/GTX pattern (NVIDIA)
    if (name.match(/RTX|GTX/i)) {
      manufacturer = "NVIDIA";
      model = name;
    }
    // Ryzen pattern (AMD)
    else if (name.match(/Ryzen|Radeon/i)) {
      manufacturer = "AMD";
      model = name;
    }
    // Core i pattern (Intel)
    else if (name.match(/Core i|Xeon|Pentium|Celeron/i)) {
      manufacturer = "Intel";
      model = name;
    }
    // PlayStation/Xbox pattern
    else if (name.match(/PlayStation|PS\d|Xbox/i)) {
      manufacturer = name.match(/PlayStation|PS\d/i) ? "Sony" : "Microsoft";
      model = name;
    }
    else {
      model = name;
    }
  }
  
  return { manufacturer, model };
}

// Helper function to process a single hardware item
export async function processHardware(
  hardwareName: string,
  options: { status: "draft" | "published"; skipExisting: boolean; generateImages?: boolean }
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    // Detect hardware type
    const hardwareType = detectHardwareType(hardwareName) || "gpu";
    
    // Parse manufacturer and model
    const { manufacturer, model } = parseHardwareName(hardwareName);
    
    // Check if hardware already exists
    let hardware = await prisma.hardware.findFirst({
      where: {
        OR: [
          { name: { equals: hardwareName, mode: "insensitive" } },
          { model: { equals: model || hardwareName, mode: "insensitive" } },
        ],
      },
    });
    
    // Check if review already exists for this hardware
    if (options.skipExisting && hardware) {
      const existingReview = await prisma.review.findFirst({
        where: { hardwareId: hardware.id },
      });
      if (existingReview) {
        return { success: false, error: "Review already exists" };
      }
    }
    
    // Create hardware entry if it doesn't exist
    if (!hardware) {
      hardware = await createHardware({
        name: hardwareName,
        type: hardwareType,
        manufacturer,
        model: model || hardwareName,
        images: [],
      });
    }
    
    // Generate review content
    const reviewContent = await generateHardwareReviewContent({
      name: hardware.name,
      type: hardware.type as HardwareType,
      manufacturer: hardware.manufacturer || undefined,
      model: hardware.model || undefined,
      description: hardware.description || undefined,
      specs: hardware.specs || undefined,
    });
    
    // Generate slug
    let slug = generateSlug(reviewContent.de.title);
    const existingSlug = await prisma.review.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }
    
    // Upload images if available (hardware might have images)
    let imageUrls: string[] = [];
    if (hardware.images && hardware.images.length > 0) {
      for (let i = 0; i < Math.min(hardware.images.length, 5); i++) {
        try {
          const syncedUrl = await uploadImage(
            hardware.images[i],
            `${slug}-hardware-${i+1}.jpg`
          );
          imageUrls.push(syncedUrl);
        } catch (err) {
          // If upload fails, use original URL
          imageUrls.push(hardware.images[i]);
        }
      }
    }
    
    // Generate images using Tavily (preferred) or OpenAI (fallback) if requested and no images exist
    if ((options.generateImages !== false) && imageUrls.length === 0) {
      try {
        console.log(`🎨 Generating review images for ${hardwareName}...`);
        const generatedImages = await generateReviewImages({
          productName: hardware.name,
          productType: hardware.type,
          manufacturer: hardware.manufacturer || undefined,
          style: "professional",
          count: 3,
          tavilySearchResults: reviewContent.tavilySearchResults, // Use Tavily images if available
        });
        imageUrls = generatedImages;
        console.log(`✅ Generated ${imageUrls.length} images`);
      } catch (error) {
        console.error(`Error generating images for ${hardwareName}:`, error);
      }
    }
    
    // Generate Amazon affiliate link
    let affiliateLink: string | null = null;
    try {
      affiliateLink = await searchAmazonHardware(
        hardwareName,
        manufacturer,
        model
      );
    } catch (error) {
      console.error("Error generating Amazon affiliate link:", error);
      // Continue without affiliate link if search fails
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "hardware",
        content: reviewContent.de.content,
        content_en: reviewContent.en.content,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        youtubeVideos: [],
        status: options.status,
        hardwareId: hardware.id,
        specs: reviewContent.specs || hardware.specs || null,
        affiliateLink: affiliateLink,
        createdAt: hardware.releaseDate || new Date(),
      },
    });
    
    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`Error processing hardware ${hardwareName}:`, error);
    return { success: false, error: error.message };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: BulkCreateHardwareOptions = await req.json();
    
    if (!body.hardwareNames || !Array.isArray(body.hardwareNames) || body.hardwareNames.length === 0) {
      return NextResponse.json(
        { error: "hardwareNames array is required" },
        { status: 400 }
      );
    }
    
    const {
      hardwareNames,
      batchSize = 3, // Smaller batch size for hardware (AI generation is slower)
      delayBetweenBatches = 3000, // Longer delay for hardware
      status = "draft",
      skipExisting = true,
      generateImages = true, // Generate images by default
    } = body;
    
    const results = {
      total: hardwareNames.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      reviews: [] as Array<{ id: string; title: string; slug: string }>,
      errors: [] as Array<{ hardware: string; error: string }>,
    };
    
    // Process hardware in batches
    for (let i = 0; i < hardwareNames.length; i += batchSize) {
      const batch = hardwareNames.slice(i, i + batchSize);
      
      const batchPromises = batch.map((hardwareName) =>
        processHardware(hardwareName.trim(), { status, skipExisting, generateImages })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const hardwareName = batch[index];
        if (result.status === "fulfilled") {
          const processResult = result.value;
          if (processResult.success && processResult.reviewId) {
            results.successful++;
            // Get review to get title and slug
            prisma.review.findUnique({ where: { id: processResult.reviewId } })
              .then((review) => {
                if (review) {
                  results.reviews.push({
                    id: review.id,
                    title: review.title,
                    slug: review.slug,
                  });
                }
              })
              .catch(() => {
                // Fallback if we can't fetch review
                results.reviews.push({
                  id: processResult.reviewId!,
                  title: hardwareName,
                  slug: generateSlug(hardwareName),
                });
              });
          } else if (processResult.error === "Review already exists") {
            results.skipped++;
          } else {
            results.failed++;
            results.errors.push({
              hardware: hardwareName,
              error: processResult.error || "Unknown error",
            });
          }
        } else {
          results.failed++;
          results.errors.push({
            hardware: hardwareName,
            error: result.reason?.message || "Processing failed",
          });
        }
      });
      
      // Delay between batches (except for the last batch)
      if (i + batchSize < hardwareNames.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    // Wait a bit for all review fetches to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return NextResponse.json({
      message: `Bulk hardware creation completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
      results,
    });
  } catch (error: any) {
    console.error("Bulk hardware create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

