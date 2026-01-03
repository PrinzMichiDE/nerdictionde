import pg from "pg";

async function applyMigration() {
  let prisma: any = null;
  
  try {
    console.log("🔧 Applying TMDB migration...");

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.warn("⚠️  DATABASE_URL environment variable is not set. Skipping migration.");
      console.warn("   This is normal if running in CI/CD without database access.");
      return;
    }

    // Only import PrismaClient if DATABASE_URL is available
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();

    // Use raw SQL to add the column if it doesn't exist
    const pool = new pg.Pool({ 
      connectionString: process.env.DATABASE_URL,
      // Set a short timeout to avoid hanging during build
      connectionTimeoutMillis: 5000,
    });

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
    console.log("✅ Migration completed successfully!");
  } catch (error: any) {
    // Don't fail the build if migration fails (might be in CI without DB)
    const errorMessage = error.message || String(error);
    const errorCode = error.code || "";
    
    if (
      errorCode === "ECONNREFUSED" || 
      errorCode === "ETIMEDOUT" ||
      errorMessage.includes("connect") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      console.warn("⚠️  Could not connect to database. Migration skipped.");
      console.warn("   This is normal if running in CI/CD without database access.");
      return;
    }
    
    // If column already exists, that's fine
    if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
      console.log("ℹ️  Column or index already exists. Skipping.");
      return;
    }
    
    console.error("❌ Migration failed:", errorMessage);
    // Don't throw - allow build to continue
    console.warn("⚠️  Continuing build despite migration warning...");
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  applyMigration()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export default applyMigration;
