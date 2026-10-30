-- Migration: Add automated content-pipeline models
-- Models: FactCheckLog, ArticleDraft, RichContentAsset
-- Run with: psql -d nerdiction -f migration.sql

-- CreateTable: FactCheckLog
CREATE TABLE "FactCheckLog" (
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

-- CreateTable: ArticleDraft
CREATE TABLE "ArticleDraft" (
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

-- CreateTable: RichContentAsset
CREATE TABLE "RichContentAsset" (
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

-- CreateIndex
CREATE INDEX "FactCheckLog_reviewId_idx" ON "FactCheckLog"("reviewId");
CREATE INDEX "FactCheckLog_status_idx" ON "FactCheckLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleDraft_slug_key" ON "ArticleDraft"("slug");
CREATE INDEX "ArticleDraft_status_idx" ON "ArticleDraft"("status");
CREATE INDEX "ArticleDraft_category_status_idx" ON "ArticleDraft"("category", "status");

-- CreateIndex
CREATE INDEX "RichContentAsset_draftId_idx" ON "RichContentAsset"("draftId");
CREATE INDEX "RichContentAsset_type_idx" ON "RichContentAsset"("type");

-- AddForeignKey
ALTER TABLE "FactCheckLog" ADD CONSTRAINT "FactCheckLog_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL;

-- AddForeignKey
ALTER TABLE "ArticleDraft" ADD CONSTRAINT "ArticleDraft_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL;

-- AddForeignKey
ALTER TABLE "RichContentAsset" ADD CONSTRAINT "RichContentAsset_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ArticleDraft"("id") ON DELETE CASCADE;
