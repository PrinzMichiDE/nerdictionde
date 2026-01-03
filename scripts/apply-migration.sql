-- Migration: Add movie and series categories
-- Execute this SQL script manually on your database

-- Add tmdbId column to Review table
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "tmdbId" INTEGER;

-- Create index for tmdbId
CREATE INDEX IF NOT EXISTS "Review_tmdbId_idx" ON "Review"("tmdbId");
