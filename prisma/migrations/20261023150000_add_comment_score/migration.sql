-- AlterTable (vorwaerts)
ALTER TABLE "Comment" ADD COLUMN "score" INTEGER NOT NULL DEFAULT 0;

-- Rueckaertwaertszugaenglichkeit (manuell rueckgaengig zu machen):
-- ALTER TABLE "Comment" DROP COLUMN "score";
-- Bestehende Daten bleiben intakt (spalte hat Default 0).
