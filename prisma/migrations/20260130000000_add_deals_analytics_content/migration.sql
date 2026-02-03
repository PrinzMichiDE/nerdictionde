-- CreateTable: Deal
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'mydealz',
    "category" TEXT,
    "reviewId" TEXT,
    "asin" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PriceAlert
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "reviewId" TEXT NOT NULL,
    "targetPrice" DOUBLE PRECISION NOT NULL,
    "email" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserPCBuild
CREATE TABLE "UserPCBuild" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "components" JSONB NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPCBuild_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EpisodeReview
CREATE TABLE "EpisodeReview" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "episode" INTEGER NOT NULL,
    "title" TEXT,
    "score" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpisodeReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GameProgress
CREATE TABLE "GameProgress" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "playtimeHours" DOUBLE PRECISION,
    "completion" INTEGER,
    "achievements" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VideoChapter
CREATE TABLE "VideoChapter" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "VideoChapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Deal
CREATE INDEX "Deal_reviewId_idx" ON "Deal"("reviewId");
CREATE INDEX "Deal_status_createdAt_idx" ON "Deal"("status", "createdAt");
CREATE INDEX "Deal_asin_idx" ON "Deal"("asin");

-- CreateIndex: PriceAlert
CREATE INDEX "PriceAlert_reviewId_idx" ON "PriceAlert"("reviewId");

-- CreateIndex: UserPCBuild
CREATE INDEX "UserPCBuild_userId_idx" ON "UserPCBuild"("userId");

-- CreateIndex: EpisodeReview
CREATE UNIQUE INDEX "EpisodeReview_reviewId_season_episode_key" ON "EpisodeReview"("reviewId", "season", "episode");
CREATE INDEX "EpisodeReview_reviewId_idx" ON "EpisodeReview"("reviewId");

-- CreateIndex: GameProgress
CREATE INDEX "GameProgress_reviewId_idx" ON "GameProgress"("reviewId");

-- CreateIndex: VideoChapter
CREATE INDEX "VideoChapter_reviewId_videoId_idx" ON "VideoChapter"("reviewId", "videoId");

-- AddForeignKey: Deal
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: PriceAlert
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: EpisodeReview
ALTER TABLE "EpisodeReview" ADD CONSTRAINT "EpisodeReview_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: GameProgress
ALTER TABLE "GameProgress" ADD CONSTRAINT "GameProgress_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: VideoChapter
ALTER TABLE "VideoChapter" ADD CONSTRAINT "VideoChapter_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
