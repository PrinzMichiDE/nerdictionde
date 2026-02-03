-- AlterTable
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "metaKeywords" TEXT;
