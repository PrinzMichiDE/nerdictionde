import axios from "axios";
import * as cheerio from "cheerio";
import { PCComponentType } from "@/types/pc-build";

export interface ScrapedPCBuild {
  pricePoint: number;
  type: "desktop" | "laptop";
  title: string;
  description: string;
  image?: string;
  components: Array<{
    type: PCComponentType;
    name: string;
    price: number;
    affiliateLink?: string;
  }>;
}

const HARDWAREDEALZ_DESKTOP_URL = "https://www.hardwaredealz.com/die-besten-gaming-desktop-pcs";
const HARDWAREDEALZ_LAPTOP_URL = "https://www.hardwaredealz.com/die-besten-gaming-laptops-und-notebooks";

export async function scrapeHardwareDealz(category: "desktop" | "laptop" = "desktop"): Promise<ScrapedPCBuild[]> {
  try {
    const url = category === "desktop" ? HARDWAREDEALZ_DESKTOP_URL : HARDWAREDEALZ_LAPTOP_URL;
    console.log(`🔍 Scraping HardwareDealz ${category} from ${url}...`);
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8",
      },
    });

    const $ = cheerio.load(data);
    const builds: ScrapedPCBuild[] = [];
    
    // Collect all build links and initial info
    const buildInfos: Array<{ pricePoint: number, title: string, detailUrl: string, description: string, image?: string }> = [];

    $(".card").each((i, card) => {
      const $card = $(card);
      const h3 = $card.find("h3").first();
      if (!h3.length) return;

      const title = h3.text().trim();
      // Improved regex to handle different price formats (e.g. 1.000, 1500)
      const priceMatch = title.match(/(\d+(?:[.,]\d+)?)\s*(?:Euro|€)/i);
      
      if (priceMatch) {
        const pricePoint = parseInt(priceMatch[1].replace(".", "").replace(",", ""));
        const detailUrl = $card.find("a.btn-warning, a.btn-primary").filter((_, a) => {
          const text = $(a).text().toLowerCase();
          return text.includes("details") || text.includes("testbericht") || text.includes("zum laptop") || text.includes("konfiguration");
        }).attr("href");
        
        // Find the image in the card
        let image = $card.find("img").first().attr("src");
        if (image && !image.startsWith("http")) {
          image = `https://www.hardwaredealz.com${image}`;
        }

        if (detailUrl) {
          buildInfos.push({
            pricePoint,
            title,
            detailUrl: detailUrl.startsWith("http") ? detailUrl : `https://www.hardwaredealz.com${detailUrl}`,
            description: $card.find(".card-body p").first().text().trim(),
            image,
          });
        }
      }
    });

    console.log(`Found ${buildInfos.length} ${category} builds to scrape in detail...`);

    // Scrape each build detail page
    for (const info of buildInfos) {
      try {
        console.log(`📄 Scraping details for ${info.pricePoint}€ ${category}: ${info.detailUrl}`);
        const { data: detailData } = await axios.get(info.detailUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
          },
        });
        
        const $d = cheerio.load(detailData);
        const build: ScrapedPCBuild = {
          pricePoint: info.pricePoint,
          type: category,
          title: info.title,
          description: info.description || $d(".entry-content p").first().text().trim(),
          image: info.image,
          components: [],
        };

        // Look for component rows in tables or lists
        $d("tr, li, div.component-row").each((__, el) => {
          const text = $(el).text().trim();
          // Pattern: "Component Name (ab 123,45 €)"
          const match = text.match(/(.*?)\s*\(?ab\s*([\d,.]+)\s*[€E?]/i);
          
          if (match) {
            const name = match[1].replace(/^[|\s•-]+/, "").trim();
            if (name.length > 2 && !name.toLowerCase().includes("gaming pc") && name.length < 150) {
              const priceStr = match[2].replace(".", "").replace(",", ".");
              const price = parseFloat(priceStr);
              
              const link = $(el).find("a").attr("href") || $(el).closest("a").attr("href") || $(el).find("a[href*='amazon'], a[href*='geizhals']").attr("href");
              
              if (!build.components.some(c => c.name === name)) {
                let finalLink = link;
                
                // Prefix relative links for initial check
                if (finalLink && finalLink.startsWith("/")) {
                  finalLink = `https://www.hardwaredealz.com${finalLink}`;
                }

                const isAmazon = finalLink && (finalLink.includes("amazon.de") || finalLink.includes("amzn.to"));
                const asinMatch = isAmazon ? finalLink.match(/\/([A-Z0-9]{10})(?:[\/?]|$)/i) : null;
                const asin = asinMatch ? asinMatch[1] : null;

                if (asin) {
                  // If we have a direct Amazon link with ASIN, use it
                  finalLink = `https://www.amazon.de/dp/${asin}?tag=michelfritzschde-21`;
                } else {
                  // For EVERYTHING ELSE (Geizhals, non-ASIN Amazon, internal links), 
                  // force the specific Amazon search link format
                  const encodedName = encodeURIComponent(name);
                  finalLink = `https://www.amazon.de/s?k=${encodedName}&__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=1HY4329FCCD5J&sprefix=${encodedName}%2Caps%2C124&linkCode=ll2&tag=michelfritzschde-21&linkId=38ed3b9216199de826066e1da9e63e2d&language=de_DE&ref_=as_li_ss_tl`;
                }

                build.components.push({
                  type: guessComponentType(name),
                  name,
                  price,
                  affiliateLink: finalLink,
                });
              }
            }
          }
        });

        if (build.components.length >= 3) {
          console.log(`✅ Successfully scraped ${build.components.length} components for ${info.pricePoint}€`);
          builds.push(build);
        } else {
          console.log(`⚠️ Only found ${build.components.length} components for ${info.pricePoint}€ on detail page, skipping.`);
        }
        
        // Small delay to be polite
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err: any) {
        console.error(`Failed to scrape details for ${info.pricePoint}€:`, err.message);
      }
    }

    console.log(`📊 Scraped total of ${builds.length} builds`);
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
  if (n.includes("display") || n.includes("zoll") || n.includes("bildschirm") || n.includes("hz") || n.includes("ips") || n.includes("oled") || n.includes("qhd") || n.includes("full-hd")) return "Display";
  return "Other";
}

