import { syncGuidesFromTopics } from "@/lib/guide-generation";

async function main() {
  console.log("🔄 Starte Guide/Wiki-Sync...");
  const result = await syncGuidesFromTopics();
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
