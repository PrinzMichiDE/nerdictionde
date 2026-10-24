-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('THUMBS_UP', 'HEART', 'PARTY', 'THINKING', 'CRY', 'ANGRY');

-- CreateTable
CREATE TABLE "review_reactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_reactions_userId_reviewId_key" ON "review_reactions"("userId", "reviewId");

-- CreateIndex
CREATE INDEX "review_reactions_reviewId_idx" ON "review_reactions"("reviewId");

-- CreateIndex
CREATE INDEX "review_reactions_userId_idx" ON "review_reactions"("userId");

-- AddForeignKey
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TwitchUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;