-- Create review_collections table
CREATE TABLE "review_collections" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "owner_id" TEXT NOT NULL,
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "review_collections_pkey" PRIMARY KEY ("id")
);

-- Create collection_items table
CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "review_collections_slug_key" ON "review_collections"("slug");
CREATE INDEX "review_collections_owner_id_idx" ON "review_collections"("owner_id");
CREATE INDEX "review_collections_is_public_updated_at_idx" ON "review_collections"("is_public", "updated_at");
CREATE INDEX "collection_items_collection_id_position_idx" ON "collection_items"("collection_id", "position");
CREATE UNIQUE INDEX "collection_items_collection_id_position_key" ON "collection_items"("collection_id", "position");
CREATE UNIQUE INDEX "collection_items_collection_id_review_id_key" ON "collection_items"("collection_id", "review_id");
CREATE INDEX "collection_items_review_id_idx" ON "collection_items"("review_id");

-- Add foreign keys
ALTER TABLE "review_collections" ADD CONSTRAINT "review_collections_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "TwitchUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "review_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;