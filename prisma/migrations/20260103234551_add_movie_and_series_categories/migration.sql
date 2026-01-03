-- AlterTable
ALTER TABLE "Review" ADD COLUMN "tmdbId" INTEGER;

-- CreateIndex
CREATE INDEX "Review_tmdbId_idx" ON "Review"("tmdbId");
