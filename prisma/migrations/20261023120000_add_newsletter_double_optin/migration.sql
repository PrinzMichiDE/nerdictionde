-- AlterTable (vorwaerts)
ALTER TABLE "NewsletterSubscription" ADD COLUMN "confirmationToken" TEXT;
ALTER TABLE "NewsletterSubscription" ADD COLUMN "confirmedAt" TIMESTAMP(3);
ALTER TABLE "NewsletterSubscription" ALTER COLUMN "isActive" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_confirmationToken_key" ON "NewsletterSubscription"("confirmationToken");

-- Rueckaertwaertszugaenglichkeit (manuell rueckgaengig zu machen):
-- ALTER TABLE "NewsletterSubscription" ALTER COLUMN "isActive" SET DEFAULT true;
-- DROP INDEX "NewsletterSubscription_confirmationToken_key";
-- ALTER TABLE "NewsletterSubscription" DROP COLUMN "confirmedAt";
-- ALTER TABLE "NewsletterSubscription" DROP COLUMN "confirmationToken";
-- Bestehende Daten bleiben intakt (spalten sind nullable, Default-geaenderung betrifft nur neue Zeilen).
