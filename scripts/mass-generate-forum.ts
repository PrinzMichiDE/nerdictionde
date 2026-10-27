import { generateForumThreads, generateForumCommentsForThread } from "@/lib/forum-generation";
import prisma from "@/lib/prisma";

async function main() {
  const args = process.argv.slice(2);
  const category = args[0] as "gaming" | "movies" | "series" | undefined;
  const threadCount = parseInt(args[1] || "20");
  const extraCommentsPerThread = parseInt(args[2] || "15");

  console.log("🚀 Starting mass forum generation...");
  console.log(`Category: ${category || "all"}`);
  console.log(`Threads per category: ${threadCount}`);
  console.log(`Extra comments per thread: ${extraCommentsPerThread}`);

  const categories = category ? [category] : ["gaming", "movies", "series"] as const;

  let totalThreads = 0;
  let totalComments = 0;

  for (const cat of categories) {
    console.log(`\n📝 Generating threads for category: ${cat}...`);
    try {
      const result = await generateForumThreads(cat, threadCount);
      console.log(`✅ Created ${result.created} threads in ${cat}`);
      if (result.errors.length > 0) {
        console.log(`⚠️  Errors: ${result.errors.length}`);
        result.errors.slice(0, 3).forEach(e => console.log(`   - ${e}`));
      }
      totalThreads += result.created;

      // Add extra comments to make it even more realistic
      if (extraCommentsPerThread > 0 && result.created > 0) {
        console.log(`💬 Adding extra comments to threads in ${cat}...`);
        const threads = await prisma.forumThread.findMany({
          where: { category: cat },
          orderBy: { createdAt: "desc" },
          take: threadCount,
        });

        for (const thread of threads) {
          try {
            const commentResult = await generateForumCommentsForThread(thread.id, extraCommentsPerThread);
            console.log(`   +${commentResult.created} comments on "${thread.title.substring(0, 40)}..."`);
            totalComments += commentResult.created;
          } catch (e) {
            console.error(`   Error adding comments to thread ${thread.id}:`, e);
          }
        }
      }
    } catch (e) {
      console.error(`Error generating for category ${cat}:`, e);
    }
  }

  console.log("\n✨ Generation complete!");
  console.log(`📊 Total threads created: ${totalThreads}`);
  console.log(`💬 Total extra comments added: ${totalComments}`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
