-- CreateTable
CREATE TABLE "review_series" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "partCount" INTEGER NOT NULL DEFAULT 0,
    "aggregateScore" DOUBLE PRECISION,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "review_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_series_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "seriesId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "seriesOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_series_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_series_slug_key" ON "review_series"("slug");

-- CreateIndex
CREATE INDEX "review_series_deletedAt_idx" ON "review_series"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "review_series_items_reviewId_key" ON "review_series_items"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "review_series_items_seriesId_seriesOrder_key" ON "review_series_items"("seriesId", "seriesOrder");

-- CreateIndex
CREATE INDEX "review_series_items_seriesId_idx" ON "review_series_items"("seriesId");

-- AddForeignKey
ALTER TABLE "review_series_items" ADD CONSTRAINT "review_series_items_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "review_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_series_items" ADD CONSTRAINT "review_series_items_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "Review" ADD COLUMN "seriesOrder" INTEGER;

-- CreateIndex
CREATE INDEX "Review_seriesId_idx" ON "Review"("seriesId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "review_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;