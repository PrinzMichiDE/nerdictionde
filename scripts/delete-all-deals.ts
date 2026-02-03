/**
 * Script to delete all deals from the database
 * Run: npx tsx scripts/delete-all-deals.ts
 */
import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Deleting all deals...");
  const result = await prisma.deal.deleteMany({});
  console.log(`✅ Deleted ${result.count} deals.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
