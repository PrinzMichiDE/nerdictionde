import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FactCheckLog" (
          "id" TEXT NOT NULL,
          "reviewId" TEXT,
          "field" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          "source" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "confidence" DOUBLE PRECISION NOT NULL,
          "note" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "FactCheckLog_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ArticleDraft" (
          "id" TEXT NOT NULL,
          "reviewId" TEXT,
          "title" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "score" INTEGER NOT NULL,
          "pros" TEXT[] NOT NULL DEFAULT '{}',
          "cons" TEXT[] NOT NULL DEFAULT '{}',
          "metaDescription" TEXT,
          "metaKeywords" TEXT,
          "jsonLd" JSON,
          "factCheckScore" INTEGER NOT NULL DEFAULT 0,
          "readabilityScore" INTEGER NOT NULL DEFAULT 0,
          "seoScore" INTEGER NOT NULL DEFAULT 0,
          "status" TEXT NOT NULL DEFAULT 'draft',
          "issues" JSON,
          "handoff" JSON,
          "sourceData" JSON,
          "publishedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ArticleDraft_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RichContentAsset" (
          "id" TEXT NOT NULL,
          "draftId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "url" TEXT,
          "content" JSON,
          "width" INTEGER,
          "height" INTEGER,
          "fileSizeKb" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RichContentAsset_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log("Tables created");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
