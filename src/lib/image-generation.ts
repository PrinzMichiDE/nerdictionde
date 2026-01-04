import openai from "@/lib/openai";
import { uploadImage } from "@/lib/blob";

export interface ImageGenerationOptions {
  productName: string;
  productType?: string;
  manufacturer?: string;
  style?: "professional" | "lifestyle" | "product-shot" | "review-style";
  aspectRatio?: "1:1" | "16:9" | "4:3";
  count?: number;
}

/**
 * Generate authentic review images using OpenAI DALL-E
 */
export async function generateReviewImages(
  options: ImageGenerationOptions
): Promise<string[]> {
  const {
    productName,
    productType = "product",
    manufacturer,
    style = "professional",
    aspectRatio = "16:9",
    count = 3,
  } = options;

  const images: string[] = [];

  // Generate multiple images with different perspectives
  const prompts = [
    `Professional product photography of ${manufacturer ? `${manufacturer} ` : ""}${productName}, ${productType}, high quality, studio lighting, clean background, product review style, detailed, sharp focus`,
    `Lifestyle photo showing ${manufacturer ? `${manufacturer} ` : ""}${productName} in use, ${productType}, natural lighting, authentic setting, review photography style, realistic, high quality`,
    `Close-up detail shot of ${manufacturer ? `${manufacturer} ` : ""}${productName}, ${productType}, showcasing key features, professional review image, sharp focus, well-lit`,
  ].slice(0, count);

  try {
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];

      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size:
            aspectRatio === "1:1"
              ? "1024x1024"
              : aspectRatio === "16:9"
              ? "1792x1024"
              : "1024x1024",
          quality: "hd",
          style: "natural",
        });

        const imageUrl = response.data?.[0]?.url;
        if (imageUrl) {
          // Upload to Vercel Blob for persistence
          const filename = `${productName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}-review-${i + 1}.png`;
          const blobUrl = await uploadImage(imageUrl, filename);
          images.push(blobUrl);
        }
      } catch (error) {
        console.error(`Error generating image ${i + 1} for ${productName}:`, error);
        // Continue with next image
      }

      // Rate limiting: wait between requests
      if (i < prompts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.error(`Error generating review images for ${productName}:`, error);
  }

  return images;
}

/**
 * Generate a single product image
 */
export async function generateProductImage(
  productName: string,
  options?: {
    manufacturer?: string;
    productType?: string;
    style?: "professional" | "lifestyle" | "product-shot";
  }
): Promise<string | null> {
  const images = await generateReviewImages({
    productName,
    productType: options?.productType,
    manufacturer: options?.manufacturer,
    style: options?.style || "professional",
    count: 1,
  });

  return images[0] || null;
}
