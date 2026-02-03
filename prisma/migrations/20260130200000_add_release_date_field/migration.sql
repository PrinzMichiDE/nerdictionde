-- AlterTable
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "releaseDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Review_releaseDate_idx" ON "Review"("releaseDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Review_category_releaseDate_idx" ON "Review"("category", "releaseDate");
