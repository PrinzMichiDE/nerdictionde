-- Add followersCount column to review_collections (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'review_collections' AND column_name = 'followers_count'
    ) THEN
        ALTER TABLE "review_collections" ADD COLUMN "followers_count" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Create collection_follows table
CREATE TABLE IF NOT EXISTS "collection_follows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_follows_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "collection_follows_user_id_collection_id_key" ON "collection_follows"("user_id", "collection_id");
CREATE INDEX IF NOT EXISTS "collection_follows_user_id_idx" ON "collection_follows"("user_id");
CREATE INDEX IF NOT EXISTS "collection_follows_collection_id_idx" ON "collection_follows"("collection_id");

-- Add foreign keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'collection_follows_user_id_fkey'
    ) THEN
        ALTER TABLE "collection_follows" ADD CONSTRAINT "collection_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "TwitchUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'collection_follows_collection_id_fkey'
    ) THEN
        ALTER TABLE "collection_follows" ADD CONSTRAINT "collection_follows_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "review_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add new NotificationType enum values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'COLLECTION_ITEM_ADDED'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
    ) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'COLLECTION_ITEM_ADDED';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'COLLECTION_FOLLOWED'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
    ) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'COLLECTION_FOLLOWED';
    END IF;
END $$;