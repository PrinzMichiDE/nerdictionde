-- AlterTable (vorwaerts)
ALTER TABLE "Comment" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- AddForeignKey (Selbstreferenz)
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL;

-- Rueckaertwaertszugaenglichkeit (manuell rueckgaengig zu machen):
-- ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";
-- DROP INDEX "Comment_parentId_idx";
-- ALTER TABLE "Comment" DROP COLUMN "parentId";
-- Bestehende Daten bleiben intakt (parentId ist nullable).
