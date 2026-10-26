import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";
import { getIGDBGameById } from "../src/lib/igdb";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starte Update auf detaillierte Metadaten...");

  const gameReviews = await prisma.review.findMany({
    where: {
      category: "game",
      igdbId: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      igdbId: true,
    },
  });

  console.log(`${gameReviews.length} Game-Reviews mit IGDB-ID gefunden.`);

  interface IGDBCompany {
  developer: boolean;
  publisher: boolean;
  company: { name: string };
}

interface IGDBPlatform {
  name: string;
}

interface IGDBGenre {
  name: string;
}

interface IGDBGameMode {
  name: string;
}

interface IGDBPlayerPerspective {
  name: string;
}

interface IGDBEngine {
  name: string;
}

interface IGDBGameData {
  involved_companies?: IGDBCompany[];
  platforms?: IGDBPlatform[];
  genres?: IGDBGenre[];
  game_modes?: IGDBGameMode[];
  player_perspectives?: IGDBPlayerPerspective[];
  engines?: IGDBEngine[];
  first_release_date?: number;
  rating?: number;
  aggregated_rating?: number;
}

  for (const review of gameReviews) {
    console.log(`\nVerarbeite: ${review.title} (ID: ${review.igdbId})...`);
    try {
      const data = await getIGDBGameById(review.igdbId!) as IGDBGameData | null;

      if (!data) {
        console.warn(`  -> Keine IGDB-Daten für ${review.title} gefunden. Überspringe.`);
        continue;
      }

      const developers = data.involved_companies?.filter((c) => c.developer).map((c) => c.company.name) || [];
      const publishers = data.involved_companies?.filter((c) => c.publisher).map((c) => c.company.name) || [];
      
      const gameMetadata = {
          developers,
          publishers,
          platforms: data.platforms?.map((p) => p.name) || [],
          genres: data.genres?.map((g) => g.name) || [],
          gameModes: data.game_modes?.map((m) => m.name) || [],
          perspectives: data.player_perspectives?.map((p) => p.name) || [],
          engines: data.engines?.map((e) => e.name) || [],
          releaseDate: data.first_release_date,
          igdbScore: data.rating,
          criticScore: data.aggregated_rating,
      };

      await prisma.review.update({
        where: { id: review.id },
        data: {
          metadata: gameMetadata,
        },
      });
      console.log(`  ✓ Erfolgreich aktualisiert.`);
    } catch (error) {
      console.error(`  ✗ Fehler beim Verarbeiten von ${review.title}:`, error);
    }
  }

  console.log("\nUpdate-Prozess abgeschlossen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

