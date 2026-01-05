import axios from "axios";
import * as cheerio from "cheerio";
import { PCComponentType } from "@/types/pc-build";

export interface ScrapedPCBuild {
  pricePoint: number;
  title: string;
  description: string;
  components: Array<{
    type: PCComponentType;
    name: string;
    price: number;
    affiliateLink?: string;
  }>;
}

const HARDWAREDEALZ_URL = "https://www.hardwaredealz.com/die-besten-gaming-desktop-pcs";

export async function scrapeHardwareDealz(): Promise<ScrapedPCBuild[]> {
  try {
    const { data } = await axios.get(HARDWAREDEALZ_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const builds: ScrapedPCBuild[] = [];

    // HardwareDealz structure: 
    // Usually H3 for build titles
    // Followed by description paragraphs
    // Then components are listed, often in divs or tables
    
    $("h3").each((_, element) => {
      const title = $(element).text().trim();
      const priceMatch = title.match(/(\d+(?:\.\d+)?)\s*Euro/i);
      
      if (priceMatch) {
        const pricePoint = parseInt(priceMatch[1].replace(".", ""));
        const build: ScrapedPCBuild = {
          pricePoint,
          title,
          description: "",
          components: [],
        };

        // Find description (usually next few paragraphs)
        let nextEl = $(element).next();
        while (nextEl.length && !nextEl.is("h3") && build.components.length === 0) {
          if (nextEl.is("p")) {
            build.description += nextEl.text().trim() + " ";
          }
          
          // Look for components in this section
          // HardwareDealz often uses specific patterns for component names and prices
          // e.g., "AMD Ryzen 5 5600GT(ab 128,03 €)"
          const text = nextEl.text();
          
          // Try to find components in links or paragraphs
          nextEl.find("a").each((__, link) => {
            const linkText = $(link).text().trim();
            const componentPriceMatch = linkText.match(/(.*?)\(ab\s*([\d,]+)\s*€\)/i);
            
            if (componentPriceMatch) {
              const name = componentPriceMatch[1].trim();
              const price = parseFloat(componentPriceMatch[2].replace(",", "."));
              const affiliateLink = $(link).attr("href");
              
              // Guess component type based on name
              const type = guessComponentType(name);
              
              build.components.push({
                type,
                name,
                price,
                affiliateLink,
              });
            }
          });

          nextEl = nextEl.next();
        }

        build.description = build.description.trim();
        if (build.components.length > 0) {
          builds.push(build);
        }
      }
    });

    return builds;
  } catch (error: any) {
    console.error("Scraping HardwareDealz failed:", error.message);
    throw new Error(`Fehler beim Scraping von HardwareDealz: ${error.message}`);
  }
}

function guessComponentType(name: string): PCComponentType {
  const n = name.toLowerCase();
  if (n.includes("ryzen") || n.includes("intel core") || n.includes("i3-") || n.includes("i5-") || n.includes("i7-") || n.includes("i9-") || n.includes("pentium")) return "CPU";
  if (n.includes("rtx") || n.includes("radeon") || n.includes("geforce") || n.includes("arc a") || n.includes("gpu") || n.includes("rx ")) return "GPU";
  if (n.includes("b450") || n.includes("b550") || n.includes("b650") || n.includes("z790") || n.includes("b760") || n.includes("a620") || n.includes("x670") || n.includes("motherboard") || n.includes("mainboard")) return "Motherboard";
  if (n.includes("ram") || n.includes("ddr4") || n.includes("ddr5") || n.includes("gb ddr") || n.includes("ripjaws") || n.includes("vengeance") || n.includes("fury")) return "RAM";
  if (n.includes("ssd") || n.includes("nvme") || n.includes("m.2") || n.includes("kingston nv") || n.includes("wd blue") || n.includes("crucial p") || n.includes("lexar")) return "SSD";
  if (n.includes("psu") || n.includes("be quiet") || n.includes("seasonic") || n.includes("watt") || n.includes("netzteil") || n.includes("corsair rm") || n.includes("kolink")) return "PSU";
  if (n.includes("gehäuse") || n.includes("case") || n.includes("masterbox") || n.includes("pure base") || n.includes("fractal") || n.includes("lian li") || n.includes("endorfy") || n.includes("nx200")) return "Case";
  if (n.includes("kühler") || n.includes("cooler") || n.includes("arctic") || n.includes("nh-d15") || n.includes("dark rock") || n.includes("freezer")) return "Cooler";
  return "Other";
}

