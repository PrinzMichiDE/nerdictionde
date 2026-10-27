import "dotenv/config";
import { generateForumThreads, generateForumCommentsForThread } from "@/lib/forum-generation";
import prisma from "@/lib/prisma";

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

async function main() {
  console.log("🚀 Starting creation of 5000 forum posts with random replies...");
  console.log("Using humanizer for all text content");
  
  const categories = ["gaming", "movies", "series"] as const;
  const totalPosts = 5000;
  const postsPerCategory = Math.floor(totalPosts / categories.length);
  const remainder = totalPosts % categories.length;
  
  let totalThreads = 0;
  let totalComments = 0;
  
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const threadCount = postsPerCategory + (i < remainder ? 1 : 0);
    
    console.log(`\n📝 Generating ${threadCount} threads for category: ${cat}...`);
    
    try {
      const result = await generateForumThreads(cat, threadCount);
      console.log(`✅ Created ${result.created} threads in ${cat}`);
      if (result.errors.length > 0) {
        console.log(`⚠️  Errors: ${result.errors.length}`);
        result.errors.slice(0, 3).forEach(e => console.log(`   - ${e}`));
      }
      totalThreads += result.created;
      
      // Add random number of replies to each thread (2 to 30 replies)
      console.log(`💬 Adding random replies to threads in ${cat}...`);
      const threads = await prisma.forumThread.findMany({
        where: { category: cat },
        orderBy: { createdAt: "desc" },
        take: threadCount,
      });
      
      for (const thread of threads) {
        try {
          const replyCount = randomInt(2, 30); // Random number of replies
          const commentResult = await generateForumCommentsForThread(thread.id, replyCount);
          console.log(`   +${commentResult.created} replies on "${thread.title.substring(0, 50)}..."`);
          totalComments += commentResult.created;
        } catch (e) {
          console.error(`   Error adding replies to thread ${thread.id}:`, e);
        }
      }
    } catch (e) {
      console.error(`Error generating for category ${cat}:`, e);
    }
  }
  
  console.log("\n✨ Generation complete!");
  console.log(`📊 Total forum posts (threads) created: ${totalThreads}`);
  console.log(`💬 Total replies (comments) added: ${totalComments}`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
