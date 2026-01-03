-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_en" TEXT,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_en" TEXT,
    "score" INTEGER NOT NULL,
    "pros" TEXT[],
    "pros_en" TEXT[],
    "cons" TEXT[],
    "cons_en" TEXT[],
    "images" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "igdbId" INTEGER,
    "steamAppId" TEXT,
    "amazonAsin" TEXT,
    "affiliateLink" TEXT,
    "hardwareId" TEXT,
    "specs" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRating" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reviewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hardware" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "specs" JSONB,
    "images" TEXT[],
    "description" TEXT,
    "description_en" TEXT,
    "releaseDate" TIMESTAMP(3),
    "msrp" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hardware_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_slug_key" ON "Review"("slug");

-- CreateIndex
CREATE INDEX "Review_slug_idx" ON "Review"("slug");

-- CreateIndex
CREATE INDEX "Review_category_status_idx" ON "Review"("category", "status");

-- CreateIndex
CREATE INDEX "Review_amazonAsin_idx" ON "Review"("amazonAsin");

-- CreateIndex
CREATE INDEX "Comment_reviewId_idx" ON "Comment"("reviewId");

-- CreateIndex
CREATE INDEX "UserRating_reviewId_idx" ON "UserRating"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRating_reviewId_key" ON "UserRating"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Hardware_slug_key" ON "Hardware"("slug");

-- CreateIndex
CREATE INDEX "Hardware_slug_idx" ON "Hardware"("slug");

-- CreateIndex
CREATE INDEX "Hardware_type_manufacturer_idx" ON "Hardware"("type", "manufacturer");

-- CreateIndex
CREATE INDEX "Hardware_name_idx" ON "Hardware"("name");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_hardwareId_fkey" FOREIGN KEY ("hardwareId") REFERENCES "Hardware"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
