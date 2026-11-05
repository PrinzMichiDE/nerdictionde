/**
 * Nerdiction.de — Bulk Review Generator (5000 Reviews)
 * Nutzt die Content-Pipeline für vollautomatische, produktionsreife Reviews
 * in allen Kategorien ohne menschlichen Eingriff.
 */

import { PrismaClient } from "@prisma/client";
import { runPipeline } from "../src/lib/content-pipeline";

const prisma = new PrismaClient();

const TARGET_COUNT = 5000;
const BATCH_SIZE = 25;
const DELAY_BETWEEN_BATCHES_MS = 3000;

const HARDWARE_PRODUCTS = [
  "AMD Ryzen 9 9950X", "Intel Core Ultra 9 285K", "AMD Radeon RX 9070 XT", "NVIDIA GeForce RTX 5070 Ti",
  "Samsung 990 Pro 4TB", "Corsair Vengeance DDR5 32GB", "ASUS ROG Strix X870E-E", "be quiet! Dark Rock Pro 5",
  "Logitech G Pro X Superlight 2", "Razer DeathAdder V3 Pro", "SteelSeries Apex Pro TKL", "Sony WH-1000XM6",
  "Samsung Odyssey G9 OLED", "LG UltraGear 27GX950A", "Keychron Q1 Max", "NZXT H9 Flow",
  "Corsair RM1000e ATX 3.1", "Thermalright Peerless Assassin 120 SE ARGB", "Crucial T705 2TB", "Fractal Design North",
  "AMD Ryzen 7 9800X3D", "Intel Core i7-14700K", "NVIDIA GeForce RTX 5080", "AMD Radeon RX 7800 XT",
  "Kingston Fury Beast DDR5 64GB", "GIGABYTE B850 AORUS ELITE", "HyperX Cloud Alpha Wireless", "Logitech MX Master 4",
];

const GAME_PRODUCTS = [
  "Hades II", "Black Myth: Wukong", "Dragon's Dogma 2", "Helldivers 2", "Stellar Blade",
  "Palworld", "Enshrouded", "Sons of the Forest", "Lies of P", "Remnant 2",
  "Baldur's Gate 3", "Alan Wake 2", "Dead Space Remake", "Resident Evil 4 Remake", "Diablo 4",
  "Starfield", "Hogwarts Legacy", "Armored Core VI", "Lies of P", "Final Fantasy VII Rebirth",
  "Ghost of Tsushima Director's Cut", "God of War Ragnarok", "Returnal", "Ratchet & Clank Rift Apart", "Astro Bot",
];

const MOVIE_PRODUCTS = [
  "Dune: Part Two", "Oppenheimer", "The Substance", "Anora", "Challengers",
  "Civil War", "Furiosa: A Mad Max Saga", "Deadpool & Wolverine", "Gladiator II", "Wicked",
  "Conclave", "The Brutalist", "Nosferatu", "A Complete Unknown", "Emilia Pérez",
];

const SERIES_PRODUCTS = [
  "Shogun", "True Detective: Night Country", "The Bear", "Fallout", "X-Men '97",
  "House of the Dragon", "The Last of Us", "Succession", "Severance", "Dark",
  "Chernobyl", "Better Call Saul", "Arcane", "Andor", "Squid Game",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getProductBatch(offset: number): Array<{ name: string; category: "game" | "hardware" | "movie" | "series" }> {
  const all = [
    ...HARDWARE_PRODUCTS.map((n) => ({ name: n, category: "hardware" as const })),
    ...GAME_PRODUCTS.map((n) => ({ name: n, category: "game" as const })),
    ...MOVIE_PRODUCTS.map((n) => ({ name: n, category: "movie" as const })),
    ...SERIES_PRODUCTS.map((n) => ({ name: n, category: "series" as const })),
  ];
  const shuffled = shuffle(all);
  // Wiederhole um genug Produkte zu haben
  const repeated: typeof all = [];
  for (let i = 0; i < Math.ceil(TARGET_COUNT / all.length) + 1; i++) {
    repeated.push(...shuffled);
  }
  return repeated.slice(offset, offset + BATCH_SIZE);
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  NERDICTION.DE - BULK REVIEW GENERATOR (5000 REVIEWS)      ║");
  console.log("║  Nutzt Content-Pipeline | Alle Kategorien | Ohne Platzhalter║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");

  // Prüfe bestehenden Stand
  const existing = await prisma.review.count({ where: { status: "published" } });
  console.log(`📊 Bestehende publizierte Reviews: ${existing}`);
  
  const toCreate = Math.max(0, TARGET_COUNT - existing);
  console.log(`🎯 Zu erstellende Reviews: ${toCreate}`);
  console.log("");

  if (toCreate === 0) {
    console.log("✅ Ziel bereits erreicht!");
    await prisma.$disconnect();
    return;
  }

  // BulkJob erstellen
  const bulkJob = await prisma.bulkJob.create({
    data: {
      jobId: `bulk-auto-${Date.now()}`,
      status: "running",
      category: "mixed",
      total: toCreate,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      currentBatch: 0,
      totalBatches: Math.ceil(toCreate / BATCH_SIZE),
      startTime: new Date(),
    },
  });

  console.log(`🚀 BulkJob gestartet: ${bulkJob.jobId}`);
  console.log(`📦 Batches: ${bulkJob.totalBatches}, Batch-Größe: ${BATCH_SIZE}`);
  console.log("");

  let totalCreated = 0;
  let totalFailed = 0;

  for (let batchNum = 0; batchNum < bulkJob.totalBatches && totalCreated < toCreate; batchNum++) {
    const batch = getProductBatch(batchNum * BATCH_SIZE);
    console.log(`\n[Batch ${batchNum + 1}/${bulkJob.totalBatches}] Starte ${batch.length} Reviews...`);

    await prisma.bulkJob.update({
      where: { jobId: bulkJob.jobId },
      data: { currentBatch: batchNum + 1 },
    });

    for (let i = 0; i < batch.length && totalCreated < toCreate; i++) {
      const product = batch[i];
      try {
        const result = await runPipeline({
          productName: product.name,
          category: product.category,
          sources: [],
          priority: "normal",
        });

        if (result.published) {
          totalCreated++;
          console.log(`  ✅ [${totalCreated}/${toCreate}] ${product.name} (${product.category}) → ${result.url}`);
          
          await prisma.bulkJob.update({
            where: { jobId: bulkJob.jobId },
            data: {
              processed: totalCreated + totalFailed,
              successful: totalCreated,
            },
          });
        } else {
          totalFailed++;
          console.log(`  ⚠️  [Skip] ${product.name} (${product.category}) - Status: ${result.status}, Issues: ${result.issues.slice(0, 2).join(", ")}`);
          
          await prisma.bulkJob.update({
            where: { jobId: bulkJob.jobId },
            data: {
              processed: totalCreated + totalFailed,
              failed: totalFailed,
            },
          });
        }
      } catch (error) {
        totalFailed++;
        console.log(`  ❌ [Error] ${product.name} (${product.category}): ${error instanceof Error ? error.message : String(error)}`);
        
        await prisma.bulkJob.update({
          where: { jobId: bulkJob.jobId },
          data: {
            processed: totalCreated + totalFailed,
            failed: totalFailed,
          },
        });
      }

      // Kleine Pause zwischen einzelnen Reviews um API-Limits zu schonen
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Pause zwischen Batches
    if (batchNum < bulkJob.totalBatches - 1 && totalCreated < toCreate) {
      console.log(`\n⏸️  Pause ${DELAY_BETWEEN_BATCHES_MS / 1000}s vor nächstem Batch...`);
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  await prisma.bulkJob.update({
    where: { jobId: bulkJob.jobId },
    data: {
      status: totalCreated >= toCreate ? "completed" : "completed",
      processed: totalCreated + totalFailed,
      successful: totalCreated,
      failed: totalFailed,
      endTime: new Date(),
    },
  });

  const finalCount = await prisma.review.count({ where: { status: "published" } });

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    BATCH ABGESCHLOSSEN                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`✅ Erfolgreich erstellt: ${totalCreated}`);
  console.log(`❌ Fehlgeschlagen/Übersprungen: ${totalFailed}`);
  console.log(`📊 Gesamt publizierte Reviews: ${finalCount}`);
  console.log(`🎯 Ziel erreicht: ${finalCount >= TARGET_COUNT ? "JA" : `NEIN (${finalCount}/${TARGET_COUNT})`}`);
  console.log("");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Kritischer Fehler:", e);
  prisma.$disconnect();
  process.exit(1);
});
