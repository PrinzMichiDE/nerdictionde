import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const reviews = [
    {
      title: "Elden Ring",
      slug: "elden-ring",
      category: "game",
      content:
        "# Elden Ring Review\n\nElden Ring is a masterpiece of open-world design...",
      score: 96,
      pros: ["Atmospheric World", "Challenging Combat", "Deep Lore"],
      cons: ["Occasional Performance Issues", "High Entry Barrier", "Vague Questlines"],
      status: "published",
    },
    {
      title: "NVIDIA RTX 4090",
      slug: "rtx-4090",
      category: "hardware",
      content:
        "# NVIDIA RTX 4090 Review\n\nThe ultimate GPU for 4K gaming and professional work...",
      score: 92,
      pros: ["Unparalleled Performance", "DLSS 3 Support", "Excellent Cooling"],
      cons: ["Extremely Expensive", "Huge Physical Size", "High Power Consumption"],
      status: "published",
    },
    {
      title: "Baldur's Gate 3",
      slug: "baldurs-gate-3",
      category: "game",
      content:
        "# Baldur's Gate 3 Review\n\nA new benchmark for cRPGs with incredible player freedom...",
      score: 97,
      pros: ["Deep Roleplaying", "Complex Narrative", "Strategic Combat"],
      cons: ["Complex UI", "Long Act 3", "Occasional Bugs"],
      status: "published",
    },
  ];

  for (const review of reviews) {
    await prisma.review.upsert({
      where: { slug: review.slug },
      update: {},
      create: review,
    });
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
