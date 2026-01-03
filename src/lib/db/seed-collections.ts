import { syncCollections } from "./collections";
import { syncTagsFromReviews } from "./tags";

/**
 * Seed initial data for collections and tags
 * Call this after migrations
 */
export async function seedDatabase() {
  console.log("🌱 Seeding database...");
  
  try {
    // Sync collections
    console.log("📚 Syncing collections...");
    await syncCollections();
    console.log("✅ Collections synced");
    
    // Sync tags
    console.log("🏷️  Syncing tags...");
    await syncTagsFromReviews();
    console.log("✅ Tags synced");
    
    console.log("🎉 Database seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}
