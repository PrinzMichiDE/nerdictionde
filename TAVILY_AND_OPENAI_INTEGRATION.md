# Tavily Search & OpenAI Image Generation Integration

This document describes the integration of Tavily Search for product research and OpenAI DALL-E for generating authentic review images.

## Overview

The system now uses:
1. **Tavily Search API** - For gathering comprehensive product information from trusted sources
2. **OpenAI DALL-E 3** - For generating authentic, professional review images

## Features

### 1. Hardware Review Generation with Tavily Search

Hardware reviews now automatically gather information from trusted tech review sites using Tavily Search:
- Product specifications
- Reviews and ratings
- Pros and cons
- Pricing information
- Technical details

**Supported Hardware Types:**
- GPU, CPU, Motherboard, RAM, Storage
- Monitors, Keyboards, Mice, Headsets
- Controllers, Consoles
- And more...

### 2. Amazon Product Review Generation

New function `generateAmazonReviewContent()` creates comprehensive Amazon product reviews using:
- Tavily Search for product research
- Real customer reviews aggregation
- Product specifications extraction
- Price and rating information

### 3. Image Generation (Tavily + OpenAI)

Automatically generates review images using a two-tier approach:
1. **Tavily Search Images (Preferred)** - Extracts real product images from trusted review sites
2. **OpenAI DALL-E 3 (Fallback)** - Generates professional images if Tavily doesn't provide enough:
   - Product photography style
   - Lifestyle images showing products in use
   - Detail shots highlighting key features
   - Multiple images per review (default: 3)

## Environment Variables

Add these to your `.env` file:

```bash
# Tavily Search API Key
TAVILY_API_KEY=your_tavily_api_key_here

# OpenAI API Key (already required)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Custom OpenAI base URL
OPENAI_CUSTOM_BASE_URL=https://api.openai.com/v1

# Optional: OpenAI model (default: gpt-4)
OPENAI_MODEL=gpt-4
```

## Usage

### Hardware Reviews

Hardware reviews automatically use Tavily Search when created via:

```typescript
// Via API endpoint
POST /api/reviews/bulk-create-hardware
{
  "hardwareNames": ["NVIDIA RTX 4090", "AMD Ryzen 9 7950X"],
  "generateImages": true, // Generate images using OpenAI
  "status": "draft"
}

// Via script
npm run tsx scripts/fetch-and-create-hardware-reviews.ts
```

### Amazon Product Reviews

Create Amazon product reviews:

```typescript
import { processAmazonProduct } from "@/lib/review-generation";

await processAmazonProduct(
  {
    name: "Product Name",
    asin: "B08XYZ123", // Optional
    affiliateLink: "https://amazon.de/..." // Optional
  },
  {
    status: "draft",
    skipExisting: true,
    generateImages: true // Generate images using OpenAI
  }
);
```

### Manual Image Generation

Generate images for any product:

```typescript
import { generateReviewImages } from "@/lib/image-generation";

const images = await generateReviewImages({
  productName: "NVIDIA RTX 4090",
  productType: "gpu",
  manufacturer: "NVIDIA",
  style: "professional", // or "lifestyle" | "product-shot" | "review-style"
  aspectRatio: "16:9", // or "1:1" | "4:3"
  count: 3
});
```

## API Functions

### Tavily Integration (`src/lib/tavily.ts`)

- `searchHardwareProduct(productName, manufacturer?)` - Search for hardware product info
- `searchAmazonProduct(productName, asin?)` - Search for Amazon product info
- `extractProductSpecs(searchResults)` - Extract specs, pros, cons from search results
- `extractTavilyImages(searchResults)` - Extract image URLs from Tavily search results

### Image Generation (`src/lib/image-generation.ts`)

- `generateReviewImages(options)` - Generate multiple review images (uses Tavily first, then OpenAI fallback)
- `generateProductImage(productName, options?)` - Generate a single product image

**Image Generation Priority:**
1. Tavily Search images (from `tavilySearchResults` parameter)
2. OpenAI DALL-E 3 generated images (if Tavily doesn't provide enough)

### Review Generation (`src/lib/review-generation.ts`)

- `generateHardwareReviewContent(hardwareData)` - Generate hardware review with Tavily integration
- `generateAmazonReviewContent(productData)` - Generate Amazon review with Tavily integration
- `processAmazonProduct(productData, options)` - Create complete Amazon review with images

## Trusted Sources

Tavily searches these trusted domains:

**Hardware Reviews:**
- techradar.com
- tomshardware.com
- anandtech.com
- pcgamer.com
- theverge.com
- arstechnica.com
- hardware.info
- computerbase.de
- golem.de
- heise.de

**Amazon Product Reviews:**
- amazon.com, amazon.de, amazon.co.uk
- techradar.com
- cnet.com
- wirecutter.com
- rtings.com
- consumerreports.org

## Image Generation Details

### Tavily Images (Preferred)
- Extracted from trusted review sites and product pages
- Real product photos from professional reviews
- Automatically filtered and validated
- Up to 10 images per search result

### OpenAI DALL-E 3 (Fallback)
- **Model**: DALL-E 3
- **Quality**: HD
- **Style**: Natural
- **Sizes**: 
  - 1:1 aspect ratio: 1024x1024
  - 16:9 aspect ratio: 1792x1024
  - 4:3 aspect ratio: 1024x1024

All images (from Tavily or OpenAI) are automatically uploaded to Vercel Blob Storage for persistence.

## Cost Considerations

- **Tavily Search**: Pay-per-search pricing (check Tavily pricing)
  - Images are included in search results (no additional cost)
- **OpenAI DALL-E 3**: ~$0.04 per image (1024x1024) or ~$0.08 per image (1792x1024)
  - Only used as fallback when Tavily doesn't provide enough images
- **OpenAI GPT-4**: Used for content generation (existing cost)

**Cost Optimization**: By using Tavily images first, you can significantly reduce OpenAI DALL-E costs since real product images from review sites are preferred over generated ones.

## Error Handling

All functions include comprehensive error handling:
- Tavily search failures fall back to basic product info
- Image generation failures don't block review creation
- Graceful degradation ensures reviews are always created

## Future Enhancements

- Cache Tavily search results to reduce API calls
- Batch image generation for better performance
- Support for more product categories
- Custom image generation prompts per product type
