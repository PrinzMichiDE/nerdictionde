import { searchHardwareProduct, extractProductSpecs, searchAmazonProduct } from "@/lib/tavily";
import { getAmazonProductData, parseAmazonUrl, hasPAAPICredentials } from "@/lib/amazon";
import { searchAmazonProducts } from "@/lib/amazon-paapi";
import { generateAmazonAffiliateLinkFromASIN, generateAmazonAffiliateLink, searchAmazonHardware } from "@/lib/amazon-search";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { PCComponentType } from "@/types/pc-build";

export interface ComponentRecommendation {
  type: PCComponentType;
  name: string;
  manufacturer?: string;
  model?: string;
  price: number;
  specs?: any;
  description?: string;
  affiliateLink?: string;
  asin?: string;
}

export interface BudgetAllocation {
  CPU: number;
  GPU: number;
  Motherboard: number;
  RAM: number;
  SSD: number;
  PSU: number;
  Case: number;
  Cooler: number;
}

/**
 * Calculate budget allocation for different price points
 */
export function calculateBudgetAllocation(totalBudget: number): BudgetAllocation {
  // Budget allocation percentages based on typical gaming PC builds
  const allocations: Record<number, BudgetAllocation> = {
    300: { CPU: 0.20, GPU: 0.35, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.08, Case: 0.05, Cooler: 0.02 },
    400: { CPU: 0.20, GPU: 0.35, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.08, Case: 0.05, Cooler: 0.02 },
    500: { CPU: 0.18, GPU: 0.38, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.08, Case: 0.04, Cooler: 0.02 },
    600: { CPU: 0.18, GPU: 0.38, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.08, Case: 0.04, Cooler: 0.02 },
    700: { CPU: 0.17, GPU: 0.40, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.08, Case: 0.03, Cooler: 0.02 },
    800: { CPU: 0.17, GPU: 0.40, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.08, Case: 0.03, Cooler: 0.02 },
    900: { CPU: 0.16, GPU: 0.42, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.07, Case: 0.02, Cooler: 0.01 },
    1000: { CPU: 0.16, GPU: 0.42, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.07, Case: 0.02, Cooler: 0.01 },
    1200: { CPU: 0.15, GPU: 0.45, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.06, Case: 0.02, Cooler: 0.01 },
    1500: { CPU: 0.15, GPU: 0.45, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.06, Case: 0.02, Cooler: 0.01 },
    1700: { CPU: 0.14, GPU: 0.47, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.05, Case: 0.02, Cooler: 0.01 },
    2000: { CPU: 0.14, GPU: 0.47, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.05, Case: 0.02, Cooler: 0.01 },
    2500: { CPU: 0.13, GPU: 0.50, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.04, Case: 0.02, Cooler: 0.01 },
    3000: { CPU: 0.13, GPU: 0.50, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.04, Case: 0.02, Cooler: 0.01 },
    3500: { CPU: 0.12, GPU: 0.52, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.03, Case: 0.02, Cooler: 0.01 },
    4500: { CPU: 0.12, GPU: 0.52, Motherboard: 0.12, RAM: 0.10, SSD: 0.08, PSU: 0.03, Case: 0.02, Cooler: 0.01 },
  };

  // Find closest price point
  const pricePoints = Object.keys(allocations).map(Number).sort((a, b) => a - b);
  let closestPricePoint = pricePoints[0];
  
  for (const point of pricePoints) {
    if (totalBudget >= point) {
      closestPricePoint = point;
    } else {
      break;
    }
  }

  const allocation = allocations[closestPricePoint] || allocations[4500];
  
  // Calculate actual budgets
  return {
    CPU: Math.round(totalBudget * allocation.CPU),
    GPU: Math.round(totalBudget * allocation.GPU),
    Motherboard: Math.round(totalBudget * allocation.Motherboard),
    RAM: Math.round(totalBudget * allocation.RAM),
    SSD: Math.round(totalBudget * allocation.SSD),
    PSU: Math.round(totalBudget * allocation.PSU),
    Case: Math.round(totalBudget * allocation.Case),
    Cooler: Math.round(totalBudget * allocation.Cooler),
  };
}

/**
 * Search for component recommendations using Tavily
 */
export async function searchComponentRecommendation(
  componentType: PCComponentType,
  budget: number,
  pricePoint: number
): Promise<ComponentRecommendation | null> {
  try {
    // Build search query based on component type and budget
    let searchQuery = "";
    
    switch (componentType) {
      case "CPU":
        if (budget < 100) {
          searchQuery = `best budget CPU under ${budget}€ gaming 2024`;
        } else if (budget < 200) {
          searchQuery = `best mid-range CPU ${budget}€ gaming 2024`;
        } else {
          searchQuery = `best high-end CPU ${budget}€ gaming 2024`;
        }
        break;
      case "GPU":
        if (budget < 200) {
          searchQuery = `best budget GPU under ${budget}€ gaming 2024`;
        } else if (budget < 400) {
          searchQuery = `best mid-range GPU ${budget}€ gaming 2024`;
        } else if (budget < 800) {
          searchQuery = `best high-end GPU ${budget}€ gaming 2024`;
        } else {
          searchQuery = `best flagship GPU ${budget}€ gaming 2024`;
        }
        break;
      case "Motherboard":
        searchQuery = `best motherboard ${budget}€ gaming 2024`;
        break;
      case "RAM":
        searchQuery = `best RAM ${budget}€ DDR4 DDR5 gaming 2024`;
        break;
      case "SSD":
        searchQuery = `best SSD ${budget}€ NVMe M.2 gaming 2024`;
        break;
      case "PSU":
        searchQuery = `best PSU power supply ${budget}€ ${pricePoint}W gaming 2024`;
        break;
      case "Case":
        searchQuery = `best PC case ${budget}€ gaming 2024`;
        break;
      case "Cooler":
        searchQuery = `best CPU cooler ${budget}€ air liquid gaming 2024`;
        break;
      default:
        return null;
    }

    // Step 1: Try to search Amazon directly via PA API if credentials available
    let paApiResults: any[] = [];
    if (hasPAAPICredentials()) {
      try {
        console.log(`📡 Attempting PA API SearchItems for "${searchQuery}"...`);
        paApiResults = await searchAmazonProducts(searchQuery, 3);
      } catch (error: any) {
        console.warn(`⚠️ PA API search failed for "${searchQuery}":`, error.message);
      }
    }

    // Step 2: Search using Tavily for general hardware info
    const searchResults = await searchHardwareProduct(searchQuery);
    
    if (!searchResults.results || searchResults.results.length === 0) {
      console.warn(`No results found for ${componentType} with budget ${budget}€`);
      if (paApiResults.length === 0) return null;
    }

    // Extract product information
    const productInfo = extractProductSpecs(searchResults);
    
    // Use OpenAI to parse and structure the component recommendation
    const searchContent = searchResults.answer || 
      searchResults.results[0]?.content?.substring(0, 2000) || 
      searchResults.results.map(r => r.content).join("\n\n").substring(0, 2000) ||
      "No summary available";

    const paApiContent = paApiResults.map(r => 
      `Amazon Product: ${r.title}\nPrice: ${r.price}\nASIN: ${r.asin}\nFeatures: ${r.features.join(", ")}`
    ).join("\n\n");

    const prompt = `Based on the following search results and official Amazon product data for a ${componentType} component with a budget of approximately ${budget}€, extract the best recommendation:

Amazon Data (PA API):
${paApiContent || "No direct Amazon API data available."}

General Web Search Summary:
${searchContent}

Product Specs Found:
${JSON.stringify(productInfo.specs, null, 2)}

Please provide a JSON response with the following structure:
{
  "name": "Full product name (e.g., 'AMD Ryzen 5 5600X' or 'NVIDIA GeForce RTX 4060')",
  "manufacturer": "Manufacturer name (e.g., 'AMD', 'Intel', 'NVIDIA', 'ASUS')",
  "model": "Model number if available",
  "price": ${Math.round(budget * 0.9)}, 
  "description": "Brief description (max 100 chars) of why this component is good for this budget",
  "asin": "ASIN from the Amazon Data if it matches the recommendation"
}

Important: 
1. If one of the Amazon products fits the budget well, prefer it.
2. The price should be realistic and close to the budget. 
3. Only return valid JSON, no additional text or markdown.`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a hardware expert specializing in gaming PC components. Extract component information from search results and provide structured recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || "{}";
    
    // Try to extract JSON from response
    let componentData: any = {};
    try {
      // Remove markdown code blocks if present
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        componentData = JSON.parse(jsonMatch[0]);
      } else {
        componentData = JSON.parse(responseText);
      }
      
      // Validate required fields
      if (!componentData.name) {
        throw new Error("Missing name field");
      }
      
      // Ensure price is a number and reasonable
      if (typeof componentData.price !== 'number' || componentData.price <= 0) {
        componentData.price = Math.round(budget * 0.9);
      }
      
      // Cap price at budget
      if (componentData.price > budget * 1.1) {
        componentData.price = Math.round(budget * 0.95);
      }
    } catch (error) {
      console.error(`Failed to parse component recommendation for ${componentType}:`, error);
      console.error(`Response was: ${responseText.substring(0, 200)}`);
      
      // Fallback: extract from search results
      const firstResult = searchResults.results[0];
      const title = firstResult?.title || `${componentType} Component`;
      
      // Try to extract manufacturer from title
      const manufacturerMatch = title.match(/(AMD|Intel|NVIDIA|ASUS|MSI|Gigabyte|ASRock|EVGA|Corsair|G.Skill|Samsung|Western Digital|Seagate|Crucial|Kingston)/i);
      
      componentData = {
        name: title,
        manufacturer: manufacturerMatch ? manufacturerMatch[1] : undefined,
        model: undefined,
        price: Math.round(budget * 0.9),
        description: firstResult?.content?.substring(0, 150) || productInfo.description?.substring(0, 150) || `Empfohlene ${componentType} für ${budget}€ Budget`,
      };
    }

    // Step 2: Try to find Amazon products if not already found via PA API
    let amazonData: any = null;
    let amazonASIN: string | undefined = componentData.asin || undefined;
    let amazonAffiliateLink: string | undefined = undefined;
    let usedAmazonAPI = paApiResults.length > 0;
    
    // If AI found an ASIN from PA API data, use it
    if (amazonASIN && paApiResults.length > 0) {
      const match = paApiResults.find(r => r.asin === amazonASIN);
      if (match) {
        amazonData = match;
        amazonAffiliateLink = generateAmazonAffiliateLinkFromASIN(amazonASIN);
      }
    }

    try {
      // If we don't have an ASIN yet, try searching via Tavily as fallback
      if (!amazonASIN) {
        const amazonSearchQuery = componentData.name || 
          `${componentType} ${componentData.manufacturer || ""} ${componentData.model || ""} gaming`.trim();
        
        const amazonSearchResults = await searchAmazonProduct(amazonSearchQuery);
        
        for (const result of amazonSearchResults.results || []) {
          if (result.url) {
            const extractedASIN = parseAmazonUrl(result.url);
            if (extractedASIN) {
              amazonASIN = extractedASIN;
              break;
            }
          }
        }
        
        if (amazonASIN) {
          try {
            const amazonProductResult = await getAmazonProductData(amazonSearchQuery, amazonASIN);
            amazonData = amazonProductResult.data;
            usedAmazonAPI = amazonProductResult.source === "paapi";
            amazonAffiliateLink = generateAmazonAffiliateLinkFromASIN(amazonASIN);
          } catch (error: any) {
            console.warn(`Amazon product fetch failed for ${amazonASIN}:`, error.message);
            amazonAffiliateLink = generateAmazonAffiliateLink(amazonSearchQuery);
          }
        } else {
          amazonAffiliateLink = generateAmazonAffiliateLink(amazonSearchQuery);
        }
      }
    } catch (error: any) {
      console.warn(`Amazon search failed for ${componentType}:`, error.message);
      const fallbackQuery = `${componentType} ${componentData.manufacturer || ""} gaming`.trim();
      amazonAffiliateLink = generateAmazonAffiliateLink(fallbackQuery);
    }

    // Merge Amazon data if available
    const finalSpecs = {
      ...productInfo.specs,
      ...(amazonData?.specs || {}),
    };
    
    const finalPrice = amazonData?.price 
      ? parseFloat(amazonData.price.replace(/[^\d,.-]/g, "").replace(",", ".")) || componentData.price || budget
      : componentData.price || budget;
    
    // Add delay to avoid rate limiting (Amazon PA API has 1 req/sec limit)
    // Longer delay when Amazon API is used
    const delay = usedAmazonAPI ? 2000 : 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      type: componentType,
      name: componentData.name || amazonData?.name || amazonData?.title || `${componentType} Component`,
      manufacturer: componentData.manufacturer || amazonData?.manufacturer,
      model: componentData.model || amazonData?.model,
      image: amazonData?.images?.[0] || amazonData?.cover?.url || null,
      price: Math.round(finalPrice),
      specs: finalSpecs,
      description: componentData.description || amazonData?.description || productInfo.description,
      affiliateLink: amazonAffiliateLink,
      asin: amazonASIN,
    };
  } catch (error) {
    console.error(`Error searching for ${componentType} component:`, error);
    return null;
  }
}

/**
 * Generate a complete PC build for a given price point
 */
export async function generatePCBuild(pricePoint: number): Promise<{
  success: boolean;
  build?: any;
  error?: string;
}> {
  try {
    const budgetAllocation = calculateBudgetAllocation(pricePoint);
    
    // Generate component recommendations
    const components: ComponentRecommendation[] = [];
    
    const componentTypes: PCComponentType[] = [
      "CPU",
      "GPU",
      "Motherboard",
      "RAM",
      "SSD",
      "PSU",
      "Case",
      "Cooler",
    ];

    for (const componentType of componentTypes) {
      const budget = budgetAllocation[componentType as keyof BudgetAllocation];
      if (budget > 0) {
        const recommendation = await searchComponentRecommendation(
          componentType,
          budget,
          pricePoint
        );
        
        if (recommendation) {
          components.push(recommendation);
        } else {
          // Fallback: create a placeholder component
          components.push({
            type: componentType,
            name: `${componentType} Component`,
            price: budget,
            description: `Recommended ${componentType} for ${pricePoint}€ build`,
          });
          // Small delay even for fallback
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // Calculate total price
    const totalPrice = components.reduce((sum, comp) => sum + (comp.price || 0), 0);

    // Generate title and description using OpenAI
    const titlePrompt = `Create a compelling German title for a ${pricePoint}€ gaming PC build. The title should be SEO-friendly and include the price point. Maximum 60 characters. Only return the title, no additional text.`;
    
    const titleCompletion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a marketing expert for gaming hardware. Create compelling, SEO-friendly titles.",
        },
        {
          role: "user",
          content: titlePrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const title = titleCompletion.choices[0]?.message?.content?.trim() || 
      `Bester ${pricePoint}€ Gaming PC - Optimale Preis-Leistung`;

    const descriptionPrompt = `Write a brief German description (2-3 sentences) for a ${pricePoint}€ gaming PC build. Mention key components and performance expectations. Maximum 200 characters.`;
    
    const descriptionCompletion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a hardware expert writing product descriptions.",
        },
        {
          role: "user",
          content: descriptionPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const description = descriptionCompletion.choices[0]?.message?.content?.trim() || 
      `Dieser ${pricePoint}€ Gaming PC bietet optimale Preis-Leistung für moderne Spiele.`;

    // Generate slug with timestamp to ensure uniqueness
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime();
    const slug = `bester-${pricePoint}-euro-gaming-pc-${year}-${month}-${timestamp}`;

    return {
      success: true,
      build: {
        pricePoint,
        title,
        slug,
        description,
        totalPrice,
        currency: "EUR",
        status: "published",
        components: components.map((comp, index) => ({
          type: comp.type,
          name: comp.name,
          manufacturer: comp.manufacturer,
          model: comp.model,
          price: comp.price,
          currency: "EUR",
          specs: {
            ...comp.specs,
            ...(comp.asin ? { asin: comp.asin } : {}),
          },
          affiliateLink: comp.affiliateLink,
          sortOrder: index,
        })),
      },
    };
  } catch (error: any) {
    console.error(`Error generating PC build for ${pricePoint}€:`, error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

