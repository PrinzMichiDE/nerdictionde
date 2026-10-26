-- Add userRatingCount and userRatingAvg columns to Review table
ALTER TABLE "Review" ADD COLUMN "userRatingCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Review" ADD COLUMN "userRatingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0;