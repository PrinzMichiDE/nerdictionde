import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check if tables exist by querying them
  const tables = [
    "twitchUser",
    "userProfile",
    "follow",
    "notification",
    "userRating",
    "bookmark",
    "review",
  ] as const;
  
  for (const table of tables) {
    try {
      // @ts-expect-error - dynamic table access
      const count = await prisma[table].count();
      console.log(`${table}: ${count} records`);
    } catch (e) {
      console.log(`${table}: ERROR - ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });