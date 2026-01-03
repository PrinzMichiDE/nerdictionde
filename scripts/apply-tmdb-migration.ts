import { PrismaClient } from "@prisma/client";
import pg from "pg";

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("Applying TMDB migration...");

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Use raw SQL to add the column if it doesn't exist
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

    // Check if column exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Review' AND column_name = 'tmdbId';
    `;

    const result = await pool.query(checkColumnQuery);

    if (result.rows.length === 0) {
      console.log("Adding tmdbId column...");
      await pool.query('ALTER TABLE "Review" ADD COLUMN "tmdbId" INTEGER;');
      console.log("✓ Column tmdbId added");
    } else {
      console.log("✓ Column tmdbId already exists");
    }

    // Check if index exists
    const checkIndexQuery = `
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'Review' AND indexname = 'Review_tmdbId_idx';
    `;

    const indexResult = await pool.query(checkIndexQuery);

    if (indexResult.rows.length === 0) {
      console.log("Creating index...");
      await pool.query('CREATE INDEX "Review_tmdbId_idx" ON "Review"("tmdbId");');
      console.log("✓ Index created");
    } else {
      console.log("✓ Index already exists");
    }

    await pool.end();
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
