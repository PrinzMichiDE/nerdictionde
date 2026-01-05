import prisma from "./prisma";
import { Hardware } from "@prisma/client";

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
 * Searches for hardware in the database by name
 */
export async function searchHardware(query: string): Promise<Hardware[]> {
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
 * Gets hardware by slug
 */
export async function getHardwareBySlug(slug: string): Promise<Hardware | null> {
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
 * Order matters: more specific patterns should be checked first
 */
export function detectHardwareType(query: string): HardwareType | null {
  const lowerQuery = query.toLowerCase();

  // Console detection (check early as it's very specific)
  if (
    lowerQuery.includes("playstation") ||
    lowerQuery.includes("ps5") ||
    lowerQuery.includes("ps4") ||
    lowerQuery.includes("ps3") ||
    lowerQuery.includes("xbox") ||
    lowerQuery.includes("nintendo") ||
    lowerQuery.includes("switch") ||
    lowerQuery.includes("steam deck") ||
    lowerQuery.includes("wii") ||
    lowerQuery.includes("gamecube")
  ) {
    return "console";
  }

  // GPU detection (check before CPU to avoid false positives)
  if (
    lowerQuery.includes("gpu") ||
    lowerQuery.includes("grafikkarte") ||
    lowerQuery.includes("graphics card") ||
    lowerQuery.includes("videokarte") ||
    lowerQuery.includes("video card") ||
    lowerQuery.match(/\brtx\s*\d/i) ||
    lowerQuery.match(/\bgtx\s*\d/i) ||
    lowerQuery.match(/\brx\s*\d/i) ||
    lowerQuery.includes("radeon") ||
    lowerQuery.includes("geforce") ||
    lowerQuery.includes("titan") ||
    lowerQuery.includes("quadro") ||
    lowerQuery.includes("tesla")
  ) {
    return "gpu";
  }

  // CPU detection (more specific patterns first)
  if (
    lowerQuery.includes("cpu") ||
    lowerQuery.includes("prozessor") ||
    lowerQuery.includes("processor") ||
    lowerQuery.match(/\bcore\s*i[-\s]?\d/i) ||
    lowerQuery.match(/\bryzen\s*\d/i) ||
    lowerQuery.match(/\bthreadripper/i) ||
    lowerQuery.match(/\bepyc/i) ||
    lowerQuery.includes("xeon") ||
    lowerQuery.includes("pentium") ||
    lowerQuery.includes("celeron") ||
    lowerQuery.includes("atom") ||
    lowerQuery.match(/\bathlon/i) ||
    lowerQuery.match(/\bfx\s*\d/i)
  ) {
    return "cpu";
  }

  // PSU detection
  if (
    lowerQuery.includes("psu") ||
    lowerQuery.includes("netzteil") ||
    lowerQuery.includes("power supply") ||
    lowerQuery.includes("stromversorgung")
  ) {
    return "psu";
  }

  // Case detection
  if (
    lowerQuery.includes("gehäuse") ||
    lowerQuery.includes("case") ||
    lowerQuery.includes("chassis") ||
    lowerQuery.includes("tower")
  ) {
    return "case";
  }

  // Cooler detection
  if (
    lowerQuery.includes("kühler") ||
    lowerQuery.includes("cooler") ||
    lowerQuery.includes("lüfter") ||
    lowerQuery.includes("fan") ||
    lowerQuery.includes("wasserkühlung") ||
    lowerQuery.includes("water cooling") ||
    lowerQuery.includes("aio")
  ) {
    return "cooler";
  }

  // Monitor detection
  if (
    lowerQuery.includes("monitor") ||
    lowerQuery.includes("bildschirm") ||
    lowerQuery.includes("display") ||
    lowerQuery.includes("screen")
  ) {
    return "monitor";
  }

  // Keyboard detection
  if (
    lowerQuery.includes("tastatur") ||
    lowerQuery.includes("keyboard") ||
    lowerQuery.includes("mechanical keyboard")
  ) {
    return "keyboard";
  }

  // Mouse detection
  if (
    lowerQuery.includes("maus") ||
    lowerQuery.includes("mouse") ||
    lowerQuery.includes("gaming mouse")
  ) {
    return "mouse";
  }

  // Headset detection
  if (
    lowerQuery.includes("headset") ||
    lowerQuery.includes("kopfhörer") ||
    lowerQuery.includes("headphones") ||
    lowerQuery.includes("headphone")
  ) {
    return "headset";
  }

  // Controller detection
  if (
    lowerQuery.includes("controller") ||
    lowerQuery.includes("gamepad") ||
    lowerQuery.includes("gamepad")
  ) {
    return "controller";
  }

  // Webcam detection (keep as monitor for now, could add new type later)
  if (
    lowerQuery.includes("webcam") ||
    lowerQuery.includes("kamera") ||
    lowerQuery.includes("camera") ||
    lowerQuery.includes("obsbot") ||
    lowerQuery.includes("streaming camera")
  ) {
    return "monitor"; // Use monitor as closest match for now
  }

  // RAM detection
  if (
    lowerQuery.match(/\bram\b/i) ||
    lowerQuery.match(/\bddr\d/i) ||
    lowerQuery.includes("speicher") ||
    lowerQuery.includes("memory") ||
    lowerQuery.match(/\b\d+\s*gb?\s*(ddr|ram)/i)
  ) {
    return "ram";
  }

  // Storage detection
  if (
    lowerQuery.match(/\bssd\b/i) ||
    lowerQuery.match(/\bhdd\b/i) ||
    lowerQuery.includes("festplatte") ||
    lowerQuery.includes("hard drive") ||
    lowerQuery.includes("harddisk") ||
    lowerQuery.includes("storage") ||
    lowerQuery.match(/\bnvme/i) ||
    lowerQuery.match(/\bm\.2/i)
  ) {
    return "storage";
  }

  // Motherboard detection
  if (
    lowerQuery.includes("mainboard") ||
    lowerQuery.includes("motherboard") ||
    lowerQuery.includes("mobo") ||
    lowerQuery.includes("mainboard")
  ) {
    return "motherboard";
  }

  return null;
}

