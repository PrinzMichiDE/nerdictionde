-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_en" TEXT,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "excerpt_en" TEXT,
    "content" TEXT NOT NULL,
    "content_en" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Gaming',
    "tags" TEXT[],
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "rssGuid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_slug_key" ON "NewsArticle"("slug");
CREATE UNIQUE INDEX "NewsArticle_rssGuid_key" ON "NewsArticle"("rssGuid");
CREATE INDEX "NewsArticle_status_publishedAt_idx" ON "NewsArticle"("status", "publishedAt");
CREATE INDEX "NewsArticle_category_idx" ON "NewsArticle"("category");
