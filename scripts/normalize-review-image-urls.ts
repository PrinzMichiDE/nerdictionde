/**
 * Normalisiert protocol-relative Review-Bild-URLs (//images.igdb.com/... → https://...).
 * Das betrifft genau die 829 Reviews, bei denen die Bilder existieren, aber
 * als //... gespeichert sind und von next/image nicht geladen werden können.
 *
 * Usage: npx tsx scripts/normalize-review-image-urls.ts --apply
 */

import prisma from "../src/lib/prisma";

async function main(apply: boolean) {
  const before = (await prisma.$queryRawUnsafe<{ count: string }[]>(`
    SELECT count(*)::int AS count
    FROM "Review"
    WHERE EXISTS (
      SELECT 1 FROM unnest(images) AS image WHERE image LIKE '//%'
    )
  `))[0]?.count;
  console.log(`Reviews mit protocol-relative Bild-URLs (vorher): ${before}`);

  if (!apply) {
    console.log("Dry-run. Re-run mit --apply zum Schreiben.");
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.$executeRawUnsafe(`
    UPDATE "Review"
    SET images = ARRAY(
      SELECT CASE WHEN image LIKE '//%' THEN 'https:' || image ELSE image END
      FROM unnest(images) WITH ORDINALITY AS ordered(image, position)
      ORDER BY position
    )
    WHERE EXISTS (
      SELECT 1 FROM unnest(images) AS image WHERE image LIKE '//%'
    )
  `);

  const after = (await prisma.$queryRawUnsafe<{ count: string }[]>(`
    SELECT count(*)::int AS count
    FROM "Review"
    WHERE EXISTS (
      SELECT 1 FROM unnest(images) AS image WHERE image LIKE '//%'
    )
  `))[0]?.count;

  console.log(`Update erledigt: ${result}`);
  console.log(`Reviews mit protocol-relative Bild-URLs (nachher): ${after}`);
}

const apply = process.argv.includes("--apply");
main(apply)
  .catch((error) => {
    console.error("Fehler:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
