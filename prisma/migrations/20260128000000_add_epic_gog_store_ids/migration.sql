-- AlterTable (only if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Review' AND column_name = 'epicId') THEN
        ALTER TABLE "Review" ADD COLUMN "epicId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Review' AND column_name = 'gogId') THEN
        ALTER TABLE "Review" ADD COLUMN "gogId" TEXT;
    END IF;
END $$;
