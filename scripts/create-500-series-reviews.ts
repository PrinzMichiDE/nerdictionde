import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getTMDBSeriesBulkLarge } from "../src/lib/tmdb-large";
import { processSeries } from "../src/lib/review-generation";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ProgressState {
  totalSeries: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  failedSeries: Array<{ name: string; tmdbId?: number; error: string }>;
  successfulSeries: Array<{ name: string; tmdbId?: number; reviewId: string }>;
  lastProcessedIndex: number;
}

const PROGRESS_FILE =
  process.env.PROGRESS_FILE || path.join(process.cwd(), "scripts", "series-reviews-progress.json");

function loadProgress(): ProgressState | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("Error loading progress:", error);
  }
  return null;
}

function saveProgress(state: ProgressState) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

function deleteProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  } catch (error) {
    console.error("Error deleting progress:", error);
  }
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 3000): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as Error;
      lastError = err;

      // Retrying will not help if the review already exists
      if (err.message?.includes("Already exists")) throw err;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`  ⚠️  Versuch ${attempt + 1} fehlgeschlagen, neuer Versuch in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Unknown error");
}

async function main() {
  const TARGET_COUNT = Number(process.env.TARGET_COUNT) || 500;
  const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 5;
  const DELAY_BETWEEN_BATCHES = 3000;
  const DELAY_BETWEEN_SERIES = 2000;
  const STATUS = process.env.REVIEW_STATUS === "draft" ? ("draft" as const) : ("published" as const);

  console.log(`🚀 Massenerstellung von ${TARGET_COUNT} Serien-Reviews`);
  console.log("=".repeat(60));

  console.log("📥 Lade Serien von TMDB...");
  const fetched = await getTMDBSeriesBulkLarge(TARGET_COUNT + 50, {
    sortBy: "popularity",
    order: "desc",
    minRating: 5,
  });

  // TMDB kann Serien über Seitengrenzen hinweg doppelt liefern
  const seen = new Set<number>();
  const unique = fetched.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));

  // Nur Serien, die bereits ausgestrahlt wurden
  const today = new Date().toISOString().slice(0, 10);
  const series = unique
    .filter((s) => s.first_air_date && s.first_air_date <= today && (s.number_of_episodes ?? 0) > 0)
    .slice(0, TARGET_COUNT);

  console.log(
    `✅ ${series.length} bereits ausgestrahlte Serien ausgewählt (${unique.length} geladen)\n`
  );
  if (series.length < TARGET_COUNT) {
    console.log(`⚠️  TMDB lieferte nur ${series.length} statt ${TARGET_COUNT} passende Serien.\n`);
  }

  const existingProgress = loadProgress();
  const canResume =
    existingProgress !== null &&
    existingProgress.totalSeries === series.length &&
    existingProgress.lastProcessedIndex < series.length - 1;

  if (existingProgress && !canResume) {
    console.log("⚠️  Vorheriger Lauf passt nicht zur aktuellen Liste, starte neu.\n");
    deleteProgress();
  }

  const progress: ProgressState = canResume
    ? (existingProgress as ProgressState)
    : {
        totalSeries: series.length,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        failedSeries: [],
        successfulSeries: [],
        lastProcessedIndex: -1,
      };

  if (canResume) {
    console.log(
      `📂 Setze fort: ${progress.processed}/${progress.totalSeries} verarbeitet, ` +
        `${progress.successful} erfolgreich, ${progress.failed} fehlgeschlagen, ${progress.skipped} übersprungen\n`
    );
  }

  const startIndex = progress.lastProcessedIndex + 1;
  const startTime = Date.now();

  for (let i = startIndex; i < series.length; i += BATCH_SIZE) {
    const batch = series.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Serien ${i + 1}-${i + batch.length} von ${series.length}`);

    await Promise.allSettled(
      batch.map(async (serie, batchIndex) => {
        if (batchIndex > 0) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_SERIES));
        }

        try {
          const result = await retryWithBackoff(() =>
            processSeries(serie, { status: STATUS, skipExisting: true })
          );

          if (result.success && result.reviewId) {
            progress.successful++;
            progress.successfulSeries.push({
              name: serie.name,
              tmdbId: serie.id,
              reviewId: result.reviewId,
            });
            console.log(`   ✅ ${serie.name}`);
          } else if (result.error === "Already exists") {
            progress.skipped++;
            console.log(`   ⏭️  ${serie.name} (existiert bereits)`);
          } else {
            progress.failed++;
            progress.failedSeries.push({
              name: serie.name,
              tmdbId: serie.id,
              error: result.error || "Unknown error",
            });
            console.log(`   ❌ ${serie.name}: ${result.error}`);
          }
        } catch (error: unknown) {
          const err = error as Error;
          progress.failed++;
          progress.failedSeries.push({
            name: serie.name,
            tmdbId: serie.id,
            error: err.message || "Unknown error",
          });
          console.log(`   ❌ ${serie.name}: ${err.message}`);
        }

        progress.processed++;
        progress.lastProcessedIndex = i + batchIndex;
        saveProgress(progress);
      })
    );

    if (i + BATCH_SIZE < series.length) {
      const elapsed = Date.now() - startTime;
      const avgPerSeries = elapsed / Math.max(progress.processed, 1);
      const remaining = series.length - (i + batch.length);
      const etaMinutes = Math.ceil((remaining * avgPerSeries) / 60000);
      console.log(`   ⏱️  ${progress.processed}/${series.length} | ETA: ~${etaMinutes} min`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  const totalMinutes = Math.floor((Date.now() - startTime) / 60000);

  console.log("\n" + "=".repeat(60));
  console.log("📊 ERGEBNIS");
  console.log(`Verarbeitet: ${progress.processed}`);
  console.log(`✅ Erstellt: ${progress.successful}`);
  console.log(`⏭️  Übersprungen: ${progress.skipped}`);
  console.log(`❌ Fehlgeschlagen: ${progress.failed}`);
  console.log(`⏱️  Dauer: ${totalMinutes} min`);

  if (progress.failedSeries.length > 0) {
    console.log(`\n❌ Fehlgeschlagene Serien (${progress.failedSeries.length}):`);
    progress.failedSeries.forEach((s) => console.log(`   - ${s.name}: ${s.error}`));
    console.log(`\n⚠️  Fortschritt gespeichert in ${PROGRESS_FILE}. Erneuter Aufruf setzt fort.`);
  } else {
    deleteProgress();
    console.log("\n✅ Alle Serien verarbeitet, Fortschrittsdatei gelöscht.");
  }
}

main()
  .catch((error) => {
    console.error("\n❌ Fataler Fehler:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
