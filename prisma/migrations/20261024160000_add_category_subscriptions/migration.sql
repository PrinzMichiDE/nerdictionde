-- Create ReviewCategory enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'ReviewCategory'
    ) THEN
        CREATE TYPE "ReviewCategory" AS ENUM ('GAMES', 'HARDWARE', 'MOVIES', 'SERIES');
    END IF;
END $$;

-- Create category_subscriptions table
CREATE TABLE IF NOT EXISTS "category_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "ReviewCategory" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "category_subscriptions_user_id_category_key" ON "category_subscriptions"("user_id", "category");
CREATE INDEX IF NOT EXISTS "category_subscriptions_category_idx" ON "category_subscriptions"("category");

-- Add foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'category_subscriptions_user_id_fkey'
    ) THEN
        ALTER TABLE "category_subscriptions" ADD CONSTRAINT "category_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "TwitchUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add category_new_review to NotificationType enum (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'category_new_review'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
    ) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'category_new_review';
    END IF;
END $$;