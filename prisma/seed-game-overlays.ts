import prisma from "../src/lib/prisma";
import type { Prisma } from "@prisma/client";
import { GAME_OVERLAY_SEED } from "../src/lib/game-overlays-seed";

async function main() {
  console.log("Seeding game overlays…");
  for (const o of GAME_OVERLAY_SEED) {
    await prisma.gameOverlay.upsert({
      where: { slug: o.slug },
      update: {
        name: o.name,
        category: o.category,
        description: o.description,
        htmlCode: o.htmlCode,
        config: o.config as Prisma.InputJsonValue,
        license: o.license,
        author: o.author,
      },
      create: {
        name: o.name,
        slug: o.slug,
        category: o.category,
        description: o.description,
        htmlCode: o.htmlCode,
        config: o.config as Prisma.InputJsonValue,
        license: o.license,
        author: o.author,
        isPublic: true,
      },
    });
  }
  console.log(`✅ ${GAME_OVERLAY_SEED.length} Game-Overlays gesichert.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
