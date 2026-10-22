-- CreateTable
CREATE TABLE "NewsSyncState" (
    "id" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsSyncState_pkey" PRIMARY KEY ("id")
);
