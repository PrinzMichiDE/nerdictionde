import prisma from "./prisma";
import { Hardware } from "@prisma/client";
import axios from "axios";

export type HardwareType =
  | "gpu"
  | "cpu"
  | "motherboard"
  | "ram"
  | "storage"
  | "psu"
  | "case"
  | "cooler"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "headset"
  | "controller"
  | "console";

export interface HardwareSearchResult {
  id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  type: HardwareType;
  manufacturer?: string | null;
  model?: string | null;
  description?: string | null;
  description_en?: string | null;
  images: string[];
  specs?: any;
  releaseDate?: Date | null;
  msrp?: number | null;
}

/**
 * Searches for hardware using the nerdiction.de API, then falls back to local database
 */
export async function searchHardware(query: string): Promise<Hardware[]> {
  const apiBaseUrl = process.env.NERDICTION_API_URL || "https://www.nerdiction.de";
  
  try {
    // First, try to search via the public API
    const apiResponse = await axios.post(
      `${apiBaseUrl}/api/hardware/search`,
      { query },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000, // 5 second timeout
      }
    );

    if (apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
      // Map API response to Hardware format
      const mappedResults = apiResponse.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        name_en: item.name_en || null,
        slug: item.slug,
        type: item.type,
        manufacturer: item.manufacturer || null,
        model: item.model || null,
        description: item.description || null,
        description_en: item.description_en || null,
        images: Array.isArray(item.images) ? item.images : [],
        specs: item.specs || null,
        releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
        msrp: item.msrp || null,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      }));

      return mappedResults as Hardware[];
    }
  } catch (error: any) {
    // If API call fails, log and fall back to local database
    console.log(`API search failed for "${query}", falling back to local database:`, error.message);
  }

  // Fallback to local database search
  const results = await prisma.hardware.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { name_en: { contains: query, mode: "insensitive" } },
        { model: { contains: query, mode: "insensitive" } },
        { manufacturer: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  return results;
}

/**
 * Gets hardware by slug using the nerdiction.de API, then falls back to local database
 */
export async function getHardwareBySlug(slug: string): Promise<Hardware | null> {
  const apiBaseUrl = process.env.NERDICTION_API_URL || "https://www.nerdiction.de";
  
  try {
    // First, try to get via the public API
    const apiResponse = await axios.get(
      `${apiBaseUrl}/api/hardware/${slug}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    if (apiResponse.data) {
      const item = apiResponse.data;
      // Map API response to Hardware format
      return {
        id: item.id,
        name: item.name,
        name_en: item.name_en || null,
        slug: item.slug,
        type: item.type,
        manufacturer: item.manufacturer || null,
        model: item.model || null,
        description: item.description || null,
        description_en: item.description_en || null,
        images: Array.isArray(item.images) ? item.images : [],
        specs: item.specs || null,
        releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
        msrp: item.msrp || null,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      } as Hardware;
    }
  } catch (error: any) {
    // If API call fails, log and fall back to local database
    console.log(`API get failed for slug "${slug}", falling back to local database:`, error.message);
  }

  // Fallback to local database
  const hardware = await prisma.hardware.findUnique({
    where: { slug },
  });

  return hardware;
}

/**
 * Creates a new hardware entry in the database
 */
export async function createHardware(data: {
  name: string;
  name_en?: string;
  type: HardwareType;
  manufacturer?: string;
  model?: string;
  description?: string;
  description_en?: string;
  specs?: any;
  images?: string[];
  releaseDate?: Date;
  msrp?: number;
}): Promise<Hardware> {
  // Generate slug from name
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check for existing slug
  let finalSlug = slug;
  const existing = await prisma.hardware.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    finalSlug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
  }

  const hardware = await prisma.hardware.create({
    data: {
      ...data,
      slug: finalSlug,
      images: data.images || [],
    },
  });

  return hardware;
}

/**
 * Detects hardware type from search query
 * This is a simple heuristic - can be improved with ML/NLP
 */
export function detectHardwareType(query: string): HardwareType | null {
  const lowerQuery = query.toLowerCase();

  // GPU detection
  if (
    lowerQuery.includes("gpu") ||
    lowerQuery.includes("grafikkarte") ||
    lowerQuery.includes("graphics card") ||
    lowerQuery.includes("rtx") ||
    lowerQuery.includes("gtx") ||
    lowerQuery.includes("rx ") ||
    lowerQuery.includes("radeon") ||
    lowerQuery.includes("geforce")
  ) {
    return "gpu";
  }

  // CPU detection
  if (
    lowerQuery.includes("cpu") ||
    lowerQuery.includes("prozessor") ||
    lowerQuery.includes("processor") ||
    lowerQuery.includes("intel") ||
    lowerQuery.includes("amd") ||
    lowerQuery.includes("ryzen") ||
    lowerQuery.includes("core i") ||
    lowerQuery.includes("xeon")
  ) {
    return "cpu";
  }

  // Console detection
  if (
    lowerQuery.includes("playstation") ||
    lowerQuery.includes("ps5") ||
    lowerQuery.includes("ps4") ||
    lowerQuery.includes("xbox") ||
    lowerQuery.includes("nintendo") ||
    lowerQuery.includes("switch") ||
    lowerQuery.includes("steam deck")
  ) {
    return "console";
  }

  // Monitor detection
  if (
    lowerQuery.includes("monitor") ||
    lowerQuery.includes("bildschirm") ||
    lowerQuery.includes("display")
  ) {
    return "monitor";
  }

  // Keyboard detection
  if (
    lowerQuery.includes("tastatur") ||
    lowerQuery.includes("keyboard")
  ) {
    return "keyboard";
  }

  // Mouse detection
  if (
    lowerQuery.includes("maus") ||
    lowerQuery.includes("mouse")
  ) {
    return "mouse";
  }

  // Headset detection
  if (
    lowerQuery.includes("headset") ||
    lowerQuery.includes("kopfhörer")
  ) {
    return "headset";
  }

  // Controller detection
  if (
    lowerQuery.includes("controller") ||
    lowerQuery.includes("gamepad")
  ) {
    return "controller";
  }

  // RAM detection
  if (
    lowerQuery.includes("ram") ||
    lowerQuery.includes("ddr") ||
    lowerQuery.includes("speicher")
  ) {
    return "ram";
  }

  // Storage detection
  if (
    lowerQuery.includes("ssd") ||
    lowerQuery.includes("hdd") ||
    lowerQuery.includes("festplatte") ||
    lowerQuery.includes("storage")
  ) {
    return "storage";
  }

  // Motherboard detection
  if (
    lowerQuery.includes("mainboard") ||
    lowerQuery.includes("motherboard") ||
    lowerQuery.includes("mainboard")
  ) {
    return "motherboard";
  }

  return null;
}

