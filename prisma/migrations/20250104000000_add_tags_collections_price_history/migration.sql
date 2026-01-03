-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewTag" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "description_en" TEXT,
    "type" TEXT NOT NULL DEFAULT 'manual',
    "autoRules" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCollection" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "source" TEXT NOT NULL DEFAULT 'amazon',
    "availability" TEXT,
    "url" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "categories" TEXT[],
    "tags" TEXT[],
    "minScore" INTEGER,
    "maxScore" INTEGER,
    "viewedReviews" TEXT[],
    "bookmarkedReviews" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_slug_idx" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_category_idx" ON "Tag"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewTag_reviewId_tagId_key" ON "ReviewTag"("reviewId", "tagId");

-- CreateIndex
CREATE INDEX "ReviewTag_reviewId_idx" ON "ReviewTag"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewTag_tagId_idx" ON "ReviewTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_slug_idx" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_featured_idx" ON "Collection"("featured");

-- CreateIndex
CREATE INDEX "Collection_sortOrder_idx" ON "Collection"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCollection_reviewId_collectionId_key" ON "ReviewCollection"("reviewId", "collectionId");

-- CreateIndex
CREATE INDEX "ReviewCollection_reviewId_idx" ON "ReviewCollection"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewCollection_collectionId_idx" ON "ReviewCollection"("collectionId");

-- CreateIndex
CREATE INDEX "ReviewCollection_sortOrder_idx" on "ReviewCollection"("sortOrder");

-- CreateIndex
CREATE INDEX "PriceHistory_reviewId_idx" ON "PriceHistory"("reviewId");

-- CreateIndex
CREATE INDEX "PriceHistory_recordedAt_idx" ON "PriceHistory"("recordedAt");

-- CreateIndex
CREATE INDEX "PriceHistory_reviewId_recordedAt_idx" ON "PriceHistory"("reviewId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_sessionId_key" ON "UserPreference"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_sessionId_idx" ON "UserPreference"("sessionId");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "Review_score_idx" ON "Review"("score");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- AddForeignKey
ALTER TABLE "ReviewTag" ADD CONSTRAINT "ReviewTag_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTag" ADD CONSTRAINT "ReviewTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCollection" ADD CONSTRAINT "ReviewCollection_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCollection" ADD CONSTRAINT "ReviewCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
