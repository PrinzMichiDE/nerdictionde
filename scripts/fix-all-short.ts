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
const BATCH_SIZE = 3;

async function generateGenericReview(title: string, category: string) {
  const prompt = `Schreibe eine vollständige Review für "${title}" (${category}) auf Deutsch für nerdiction.de. 
Mindestlänge 4500 Zeichen. Verwende Inhaltsverzeichnis, H2/H3 mit Ankern {#...}, Abschnitte: Einleitung, Features/Gameplay, Technik/Grafik, Sound/Atmosphäre, Vor- und Nachteile (genau 5 Pros, 5 Cons), Fazit. Objektiv, keine KI-Erwähnung. Gib JSON: {"title":"${title}","content":"...","pros":["p1","p2","p3","p4","p5"],"cons":["c1","c2","c3","c4","c5"],"score":85}`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 6000,
    });
    const raw = response.choices[0]?.message?.content || "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

async function fixReview(review: any) {
  try {
    let generated: any = null;

    if (review.category === "game" && review.igdbId) {
      try {
        const gameData = await getIGDBGameById(review.igdbId);
        if (gameData) generated = await generateReviewContent(gameData, 0);
      } catch (e) {}
    } else if (review.category === "movie" && review.tmdbId) {
      try {
        const movieData = await getTMDBMovieById(review.tmdbId);
        if (movieData) generated = await generateReviewContentForMovie(movieData);
      } catch (e) {}
    } else if (review.category === "series" && review.tmdbId) {
      try {
        const seriesData = await getTMDBSeriesById(review.tmdbId);
        if (seriesData) generated = await generateReviewContentForSeries(seriesData);
      } catch (e) {}
    }

    if (!generated?.de?.content) {
      const generic = await generateGenericReview(review.title, review.category);
      if (generic?.content) {
        generated = { de: { title: generic.title, content: generic.content, pros: generic.pros, cons: generic.cons }, score: generic.score };
      }
    }

    if (!generated?.de?.content) {
      console.log(`SKIP ${review.slug}`);
      return;
    }

    const images = review.images || [];
    const contentDe = replaceImagePlaceholders(generated.de.content, images, review.title);
    
    await prisma.review.update({
      where: { id: review.id },
      data: {
        content: contentDe,
        content_en: contentDe,
        title: generated.de.title || review.title,
        score: generated.score || 80,
        pros: generated.de.pros?.length === 5 ? generated.de.pros : (generated.de.pros || review.pros),
        cons: generated.de.cons?.length === 5 ? generated.de.cons : (generated.de.cons || review.cons),
      },
    });
    console.log(`OK ${review.slug} (${contentDe.length})`);
  } catch (e) {
    console.log(`ERR ${review.slug}`);
  }
}

async function main() {
  const reviews = await prisma.review.findMany({
    where: { status: "published" },
    select: {
      id: true, slug: true, title: true, category: true, content: true,
      igdbId: true, tmdbId: true, images: true, pros: true, cons: true
    }
  });

  const shortReviews = reviews.filter(r => (r.content || "").length < MIN_LENGTH);
  console.log(`Found ${shortReviews.length} short reviews`);

  for (let i = 0; i < shortReviews.length; i += BATCH_SIZE) {
    const batch = shortReviews.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(shortReviews.length/BATCH_SIZE)}`);
    await Promise.all(batch.map(fixReview));
  }
  console.log("DONE");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
