import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
  try {
    const response = await axios.get("https://www.michelfritzsch.de/impressum", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    
    // Extract main content
    const mainContent = $("main").html() || $("body").html() || "";
    
    console.log("=== IMPRESSUM CONTENT ===");
    console.log(mainContent);
    
    // Also try to extract text content
    const textContent = $("main").text() || $("body").text();
    console.log("\n=== TEXT CONTENT ===");
    console.log(textContent);
  } catch (error: any) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data.substring(0, 500));
    }
  }
}

main();
