import { syncNewsFromRss } from "@/lib/news-generation";

async function main() {
  console.log("🔄 Starte News-Sync aus RSS-Feed...");
  const result = await syncNewsFromRss();
  console.log("Ergebnis:", result);
  if (!result.success) {
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fehler:", error);
    process.exit(1);
  });
