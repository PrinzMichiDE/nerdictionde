import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { processGame } from "../src/lib/review-generation";
import { processMovie } from "../src/lib/review-generation";
import { processSeries } from "../src/lib/review-generation";
import { processHardware } from "../src/lib/review-generation";
import { getIGDBGamesBulkLarge, type IGDBGame } from "../src/lib/igdb";
import { getTMDBMoviesBulkLarge, getTMDBSeriesBulkLarge } from "../src/lib/tmdb-large";
import type { TMDBMovie, TMDBSeries } from "../src/lib/tmdb";
import { HARDWARE_CATALOG, type HardwareCatalogItem } from "../src/lib/hardware-catalog";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

export type ReviewCategory = "game" | "movie" | "series" | "hardware";

// Die "amazon"-Kategorie hat weder Prozessor noch Datenquelle und wird ausgelassen.
const ALL_CATEGORIES: ReviewCategory[] = ["game", "movie", "series", "hardware"];

const CATEGORIES: ReviewCategory[] = (process.env.CATEGORIES || ALL_CATEGORIES.join(","))
  .split(",")
  .map((c) => c.trim().toLowerCase())
  .filter((c): c is ReviewCategory => ALL_CATEGORIES.includes(c as ReviewCategory));

const TARGET_COUNT = Number(process.env.TARGET_COUNT) || 50;
const BATCH_SIZE = Math.max(1, Number(process.env.BATCH_SIZE) || 3);
const DELAY_BETWEEN_ITEMS = Number(process.env.DELAY_BETWEEN_ITEMS) || 2000;
const DELAY_BETWEEN_BATCHES = Number(process.env.DELAY_BETWEEN_BATCHES) || 3000;
const STATUS: "draft" | "published" =
  process.env.REVIEW_STATUS === "published" ? "published" : "draft";

const PROGRESS_DIR = path.resolve(process.cwd(), "scripts");

function progressPath(category: ReviewCategory) {
  return path.join(PROGRESS_DIR, `mass-reviews-${category}-progress.json`);
}

interface ProgressState {
  category: ReviewCategory;
  target: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  lastProcessedIndex: number;
  successfulItems: Array<{ name: string; reviewId: string }>;
  failedItems: Array<{ name: string; error: string }>;
}

function loadProgress(category: ReviewCategory): ProgressState | null {
  try {
    const file = progressPath(category);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf-8")) as ProgressState;
  } catch (error) {
    console.error(`Konnte Fortschritt für ${category} nicht lesen:`, error);
    return null;
  }
}

function saveProgress(category: ReviewCategory, state: ProgressState) {
  try {
    fs.writeFileSync(progressPath(category), JSON.stringify(state, null, 2));
  } catch (error) {
    console.error(`Konnte Fortschritt für ${category} nicht speichern:`, error);
  }
}

function deleteProgress(category: ReviewCategory) {
  try {
    const file = progressPath(category);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch (error) {
    console.error(`Konnte Fortschrittsdatei für ${category} nicht löschen:`, error);
  }
}

/** Lädt einen vorhandenen Fortschritt oder initialisiert einen neuen. */
function loadOrInitProgress(
  category: ReviewCategory,
  target: number,
  totalCandidates: number
): ProgressState {
  const saved = loadProgress(category);
  if (
    saved &&
    saved.target === target &&
    saved.lastProcessedIndex < totalCandidates - 1
  ) {
    console.log(
      `📂 Setze fort: ${saved.processed}/${totalCandidates} verarbeitet, ${saved.successful} erfolgreich, ${saved.failed} fehlgeschlagen`
    );
    return saved;
  }
  return {
    category,
    target,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    lastProcessedIndex: -1,
    successfulItems: [],
    failedItems: [],
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ProcessResult {
  success: boolean;
  reviewId?: string;
  error?: string;
}

interface Candidate<T> {
  id: string;
  name: string;
  item: T;
}

/** Bereits in der DB vorhandene externe IDs, damit keine Duplikate entstehen. */
async function existingIdsFor(category: ReviewCategory): Promise<Set<string>> {
  const rows = await prisma.review.findMany({
    where: { category },
    select: { igdbId: true, tmdbId: true, hardwareId: true },
  });
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.igdbId != null) ids.add(String(row.igdbId));
    if (row.tmdbId != null) ids.add(String(row.tmdbId));
    if (row.hardwareId != null) ids.add(String(row.hardwareId));
  }
  return ids;
}

/** Verarbeitet Kandidaten in Chargen mit Fortschritt, Resume und Pausen.
 * Stoppt sobald `target` Reviews erfolgreich erstellt wurden. */
async function processInBatches<T>(
  category: ReviewCategory,
  candidates: Candidate<T>[],
  processOne: (cand: Candidate<T>) => Promise<ProcessResult>,
  progress: ProgressState
): Promise<ProgressState> {
  const startIndex = progress.lastProcessedIndex + 1;
  const toProcess = candidates.slice(startIndex);
  const startTime = Date.now();

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    // Ziel erreicht – keine weiteren Reviews mehr erstellen
    if (progress.successful >= progress.target) break;

    const batch = toProcess.slice(i, i + BATCH_SIZE);
    console.log(
      `\n📦 ${category}: ${startIndex + i + 1}-${Math.min(
        startIndex + i + batch.length,
        candidates.length
      )} von ${candidates.length} (Ziel: ${progress.successful}/${progress.target})`
    );

    await Promise.allSettled(
      batch.map(async (cand, batchIndex) => {
        if (progress.successful >= progress.target) return;
        if (batchIndex > 0) await sleep(DELAY_BETWEEN_ITEMS);
        const result = await processOne(cand);
        if (result.success && result.reviewId) {
          progress.successful++;
          progress.successfulItems.push({ name: cand.name, reviewId: result.reviewId });
          console.log(`   ✅ ${cand.name} (${progress.successful}/${progress.target})`);
        } else if (result.error === "Already exists") {
          progress.skipped++;
          console.log(`   ⏭️  ${cand.name} (bereits vorhanden)`);
        } else {
          progress.failed++;
          progress.failedItems.push({
            name: cand.name,
            error: result.error || "Unbekannter Fehler",
          });
          console.log(`   ❌ ${cand.name}: ${result.error}`);
        }
        progress.processed++;
        progress.lastProcessedIndex = startIndex + i + batchIndex;
        saveProgress(category, progress);
      })
    );

    if (progress.successful >= progress.target) {
      console.log(`   🎯 Ziel von ${progress.target} für ${category} erreicht.`);
      break;
    }

    if (i + BATCH_SIZE < toProcess.length) {
      const elapsed = Date.now() - startTime;
      const avg = elapsed / Math.max(progress.processed, 1);
      const remaining = Math.max(0, progress.target - progress.successful);
      const eta = Math.ceil((remaining * avg) / 60000);
      console.log(`   ⏱️  Erfolgreich: ${progress.successful}/${progress.target} | ETA: ~${eta} min`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  return progress;
}

async function runGames(): Promise<ProgressState> {
  console.log(`\n🎮 Kategorie: Games (IGDB)`);
  const existing = await existingIdsFor("game");
  const raw = await getIGDBGamesBulkLarge(TARGET_COUNT + existing.size, {
    sortBy: "popularity",
    order: "desc",
    minRating: 50,
    releasedOnly: true,
  });

  const seen = new Set<string>();
  const candidates: Candidate<IGDBGame>[] = raw
    .filter((g) => {
      if (seen.has(String(g.id))) return false;
      seen.add(String(g.id));
      return !existing.has(String(g.id));
    })
    .map((g) => ({ id: String(g.id), name: g.name, item: g }));

  console.log(`✅ ${candidates.length} neue Spiele als Kandidaten ausgewählt`);

  const progress = loadOrInitProgress("game", TARGET_COUNT, candidates.length);

  return processInBatches("game", candidates, (cand) =>
    processGame(cand.item, { status: STATUS, skipExisting: true })
  , progress);
}

async function runMovies(): Promise<ProgressState> {
  console.log(`\n🎬 Kategorie: Filme (TMDB)`);
  const existing = await existingIdsFor("movie");
  const today = new Date().toISOString().slice(0, 10);
  const raw = await getTMDBMoviesBulkLarge(TARGET_COUNT + existing.size, {
    sortBy: "popularity",
    order: "desc",
    releaseDateLte: today,
  });

  const seen = new Set<string>();
  const candidates: Candidate<TMDBMovie>[] = raw
    .filter((m) => {
      if (seen.has(String(m.id))) return false;
      seen.add(String(m.id));
      return !existing.has(String(m.id));
    })
    .map((m) => ({ id: String(m.id), name: m.title, item: m }));

  console.log(`✅ ${candidates.length} neue Filme als Kandidaten ausgewählt`);

  const progress = loadOrInitProgress("movie", TARGET_COUNT, candidates.length);

  return processInBatches("movie", candidates, (cand) =>
    processMovie(cand.item, { status: STATUS, skipExisting: true })
  , progress);
}

async function runSeries(): Promise<ProgressState> {
  console.log(`\n📺 Kategorie: Serien (TMDB)`);
  const existing = await existingIdsFor("series");
  const today = new Date().toISOString().slice(0, 10);
  const raw = await getTMDBSeriesBulkLarge(TARGET_COUNT + existing.size, {
    sortBy: "popularity",
    order: "desc",
    minRating: 5,
  });

  // Nur bereits ausgestrahlte Serien mit Episoden
  const seen = new Set<string>();
  const candidates: Candidate<TMDBSeries>[] = raw
    .filter((s) => {
      if (seen.has(String(s.id))) return false;
      seen.add(String(s.id));
      return (
        !existing.has(String(s.id)) &&
        s.first_air_date &&
        s.first_air_date <= today &&
        (s.number_of_episodes ?? 0) > 0
      );
    })
    .map((s) => ({ id: String(s.id), name: s.name, item: s }));

  console.log(`✅ ${candidates.length} neue Serien als Kandidaten ausgewählt`);

  const progress = loadOrInitProgress("series", TARGET_COUNT, candidates.length);

  return processInBatches("series", candidates, (cand) =>
    processSeries(cand.item, { status: STATUS, skipExisting: true })
  , progress);
}

async function runHardware(): Promise<ProgressState> {
  console.log(`\n🔧 Kategorie: Hardware (Katalog)`);
  const existing = await existingIdsFor("hardware");

  const candidates: Candidate<HardwareCatalogItem>[] = HARDWARE_CATALOG.map(
    (item, index) => ({
      id: String(index + 1),
      name: item.name,
      item,
    })
  ).filter((c) => !existing.has(c.id));

  console.log(`✅ ${candidates.length} neue Hardware-Produkte als Kandidaten ausgewählt`);

  const progress = loadOrInitProgress("hardware", TARGET_COUNT, candidates.length);

  return processInBatches("hardware", candidates, (cand) => {
    const hw = cand.item;
    // hardwareId bewusst nicht setzen: Katalog-Items sind nicht in der
    // Hardware-Tabelle, der FK würde verletzen. review kann ohne hardwareId erstellt werden.
    return processHardware(
      {
        name: hw.name,
        manufacturer: hw.manufacturer,
        model: hw.model,
        type: hw.type,
        msrp: hw.msrp,
        releaseDate: hw.releaseDate,
        specs: (hw.specs as unknown) as Prisma.JsonValue | undefined,
        image: hw.image,
      },
      { status: STATUS, skipExisting: true }
    );
  }, progress);
}

const RUNNERS: Record<ReviewCategory, () => Promise<ProgressState>> = {
  game: runGames,
  movie: runMovies,
  series: runSeries,
  hardware: runHardware,
};

async function main() {
  console.log(
    `🚀 Massenerstellung von Reviews – Kategorien: ${CATEGORIES.join(", ")}`
  );
  console.log(
    `   Ziel pro Kategorie: ${TARGET_COUNT} | Status: ${STATUS} | Batch: ${BATCH_SIZE}`
  );
  console.log(`   Hinweis: "amazon" wird nicht unterstützt (kein Prozessor/Datenquelle).`);
  console.log("=".repeat(60));

  const totals = { successful: 0, failed: 0, skipped: 0, processed: 0 };

  for (const category of CATEGORIES) {
    const progress = await RUNNERS[category]();
    totals.successful += progress.successful;
    totals.failed += progress.failed;
    totals.skipped += progress.skipped;
    totals.processed += progress.processed;

    console.log(`\n📊 ${category}: ✅ ${progress.successful}, ⏭️  ${progress.skipped}, ❌ ${progress.failed}`);

    if (progress.failed === 0 && progress.processed > 0) {
      deleteProgress(category);
      console.log(`   ✅ Fortschrittsdatei für ${category} gelöscht.`);
    } else if (progress.failed > 0) {
      console.log(`   ⚠️  Fortschritt gespeichert unter ${progressPath(category)}. Erneuter Lauf setzt fort.`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 GESAMTERGEBNIS");
  console.log(`   Verarbeitet: ${totals.processed}`);
  console.log(`   ✅ Erstellt:   ${totals.successful}`);
  console.log(`   ⏭️  Übersprungen: ${totals.skipped}`);
  console.log(`   ❌ Fehlgeschlagen: ${totals.failed}`);
  console.log("\n🎉 Fertig.");
}

main()
  .catch((error) => {
    console.error("\n❌ Fataler Fehler:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
