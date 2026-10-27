import "dotenv/config";
import { generateForumThreads } from "@/lib/forum-generation";
import prisma from "@/lib/prisma";

async function main() {
  console.log("Testing forum generation...");
  const result = await generateForumThreads("gaming", 2);
  console.log("Result:", result);
}
main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
