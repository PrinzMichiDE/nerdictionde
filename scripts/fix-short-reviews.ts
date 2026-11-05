import prisma from "../src/lib/prisma";
import { getIGDBGameById } from "../src/lib/igdb";
import { getTMDBMovieById, getTMDBSeriesById } from "../src/lib/tmdb";
import { generateReviewContent } from "../src/lib/review-generation";
import { generateReviewContentForMovie } from "../src/lib/review-generation";
import { generateReviewContentForSeries } from "../src/lib/review-generation";
import { replaceImagePlaceholders } from "../src/lib/image-placeholder";
import { generateSEOMetadata } from "../src/lib/seo-generation";
import openai, { OPENAI_MODEL } from "../src/lib/openai";

const MIN_LENGTH = 4000;

async function generateGenericReview(title: string, category: string, existingContent: string) {
  const prompt = `Du bist ein erfahrener Redakteur für Nerdiction.de. Schreibe eine vollständige, professionelle und SEO-optimierte Review für "${title}" in deutscher Sprache.

Kategorie: ${category}

Vorhandener Inhalt (als Referenz): ${existingContent.substring(0, 500)}

Anforderungen:
- Mindestens 4000 Zeichen
- Verwende eine klare Struktur mit Inhaltsverzeichnis, H2/H3 Überschriften mit Ankern
- Ausführliche Abschnitte: Einleitung, Gameplay/Features, Grafik/Technik, Sound/Atmosphäre, Spielzeit/Wiederspielwert, Vor- und Nachteile, Fazit
- Genau 5 Pros und 5 Cons in deutscher Sprache
- Objektiver, kompetenter Tonfall
- Keine Erwähnung von KI
- Fließtext, keine Stichpunkte in langen Absätzen
- Realistische Bewertung

Gib nur das JSON zurück im Format:
{
  "title": "...",
  "content": "kompletter Markdown-Inhalt...",
  "pros": ["...", "...", "...", "...", "..."],
  "cons": ["...", "...", "...", "...", "..."],
  "score": 85
}`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Fehler bei generischer Generierung:", e);
    return null;
  }
}

async function main() {
  console.log(`Suche Reviews mit Content < ${MIN_LENGTH} Zeichen...`);
  
  const reviews = await prisma.review.findMany({
    where: {
      status: "published"
    },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      content: true,
      content_en: true,
      igdbId: true,
      tmdbId: true,
      images: true,
    }
  });
  
  const shortReviews = reviews.filter(r => {
    const len = (r.content || "").length;
    return len < MIN_LENGTH;
  });
  
  console.log(`Gefunden: ${shortReviews.length} Reviews mit < ${MIN_LENGTH} Zeichen`);
  
  for (const review of shortReviews) {
    console.log(`\n🔄 Verarbeite: ${review.title} (${review.slug}) - ${review.content?.length || 0} Zeichen`);
    
    try {
      let generated: any = null;
      
      if (review.category === "game" && review.igdbId) {
        const gameData = await getIGDBGameById(review.igdbId);
        if (gameData) {
          generated = await generateReviewContent(gameData, 0);
        }
      } else if (review.category === "movie" && review.tmdbId) {
        const movieData = await getTMDBMovieById(review.tmdbId);
        if (movieData) {
          generated = await generateReviewContentForMovie(movieData);
        }
      } else if (review.category === "series" && review.tmdbId) {
        const seriesData = await getTMDBSeriesById(review.tmdbId);
        if (seriesData) {
          generated = await generateReviewContentForSeries(seriesData);
        }
      }
      
      // Fallback für Reviews ohne externe IDs
      if (!generated?.de?.content && !generated?.en?.content) {
        const generic = await generateGenericReview(review.title, review.category, review.content || "");
        if (generic?.content) {
          generated = {
            de: {
              title: generic.title || review.title,
              content: generic.content,
              pros: generic.pros || [],
              cons: generic.cons || []
            },
            en: {
              title: generic.title || review.title,
              content: generic.content,
              pros: generic.pros || [],
              cons: generic.cons || []
            },
            score: generic.score || 75
          };
        }
      }
      
      if (!generated?.de?.content && !generated?.en?.content) {
        console.log(`  ⚠️  Keine Generierung möglich, überspringe`);
        continue;
      }
      
      const images = review.images || [];
      const contentDe = replaceImagePlaceholders(generated.de.content, images, review.title);
      const contentEn = generated.en?.content 
        ? replaceImagePlaceholders(generated.en.content, images, review.title)
        : contentDe;
      
      let seoMeta: { metaDescription: string; metaKeywords: string } | null = null;
      try {
        seoMeta = await generateSEOMetadata(generated.de.title || review.title, contentDe, review.category);
      } catch (error) {
        console.warn("  SEO-Metadaten-Generierung fehlgeschlagen");
      }
      
      await prisma.review.update({
        where: { id: review.id },
        data: {
          content: contentDe,
          content_en: contentEn,
          title: generated.de.title || review.title,
          score: generated.score || review.score,
          pros: generated.de.pros?.length ? generated.de.pros : (review.pros || []),
          cons: generated.de.cons?.length ? generated.de.cons : (review.cons || []),
          ...(seoMeta
            ? { metaDescription: seoMeta.metaDescription, metaKeywords: seoMeta.metaKeywords }
            : {}),
        },
      });
      
      console.log(`  ✅ Aktualisiert: ${contentDe.length} Zeichen (DE)`);
    } catch (error) {
      console.error(`  ❌ Fehler:`, error);
    }
  }
  
  console.log("\n✅ Fertig");
}

main()
  .catch((error) => {
    console.error("Fehler:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
