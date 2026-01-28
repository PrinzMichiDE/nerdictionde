-- AlterTable (only if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Review' AND column_name = 'tmdbId') THEN
        ALTER TABLE "Review" ADD COLUMN "tmdbId" INTEGER;
    END IF;
END $$;

-- CreateIndex (only if index doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'Review' AND indexname = 'Review_tmdbId_idx') THEN
        CREATE INDEX "Review_tmdbId_idx" ON "Review"("tmdbId");
    END IF;
END $$;
