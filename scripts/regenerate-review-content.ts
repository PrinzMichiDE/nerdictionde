import prisma from "../src/lib/prisma";
import { getIGDBGameById } from "../src/lib/igdb";
import { generateReviewContent } from "../src/lib/review-generation";
import { replaceImagePlaceholders } from "../src/lib/image-placeholder";
import { generateSEOMetadata } from "../src/lib/seo-generation";

const DEFAULT_SLUG =
  "lootbound-ein-tactical-roguelite-mit-komplexen-mechaniken-und-d-sterer-fantasy";

async function main() {
  const slug = process.argv[2]?.trim() || DEFAULT_SLUG;

  const review = await prisma.review.findUnique({ where: { slug } });
  if (!review) {
    console.error(`Review mit Slug "${slug}" nicht gefunden.`);
    process.exit(1);
  }

  if (review.category !== "game" || !review.igdbId) {
    console.error(
      `Review "${review.title}" ist keine Game-Review mit IGDB-ID (igdbId=${review.igdbId}).`
    );
    process.exit(1);
  }

  console.log(`🔄 Regeneriere Inhalt für: ${review.title} (IGDB ${review.igdbId})`);

  const gameData = await getIGDBGameById(review.igdbId);
  if (!gameData) {
    console.error(`IGDB-Daten für ID ${review.igdbId} nicht gefunden.`);
    process.exit(1);
  }

  const generated = await generateReviewContent(gameData, 0);

  if (!generated.de?.content || !generated.en?.content) {
    console.error("Generierung lieferte leeren Inhalt.");
    process.exit(1);
  }

  const images = review.images || [];
  const contentDe = replaceImagePlaceholders(generated.de.content, images, review.title);
  const contentEn = replaceImagePlaceholders(generated.en.content, images, review.title);

  let seoMeta: { metaDescription: string; metaKeywords: string } | null = null;
  try {
    seoMeta = await generateSEOMetadata(generated.de.title, contentDe, "game");
  } catch (error) {
    console.warn("SEO-Metadaten-Generierung fehlgeschlagen (nicht blockierend):", error);
  }

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: {
      content: contentDe,
      content_en: contentEn,
      ...(seoMeta
        ? { metaDescription: seoMeta.metaDescription, metaKeywords: seoMeta.metaKeywords }
        : {}),
    },
  });

  console.log(
    `✅ Inhalt regeneriert: DE ${contentDe.length} Zeichen, EN ${contentEn.length} Zeichen`
  );
  console.log(`   Score aus Generierung: ${generated.score}`);
  console.log(`   Slug: ${updated.slug}`);
  console.log(`   URL: https://www.nerdiction.de/reviews/${updated.slug}`);
}

main()
  .catch((error) => {
    console.error("Fehler beim Regenerieren:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
