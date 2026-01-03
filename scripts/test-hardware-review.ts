/**
 * Test script for Hardware Review Generation
 * Run with: npx tsx scripts/test-hardware-review.ts
 */

import { searchHardware, detectHardwareType, createHardware } from "../src/lib/hardware";

async function testHardwareReviewGeneration() {
  console.log("🧪 Testing Hardware Review Generation\n");

  // Test 1: Hardware Type Detection
  console.log("Test 1: Hardware Type Detection");
  const testQueries = [
    "RTX 4090",
    "Ryzen 9 7950X",
    "PlayStation 5",
    "Logitech G Pro X",
    "Samsung Odyssey G9",
  ];

  for (const query of testQueries) {
    const detectedType = detectHardwareType(query);
    console.log(`  "${query}" -> ${detectedType || "null"}`);
  }
  console.log();

  // Test 2: Hardware Search
  console.log("Test 2: Hardware Search");
  try {
    const searchResults = await searchHardware("RTX");
    console.log(`  Found ${searchResults.length} hardware items matching "RTX"`);
    if (searchResults.length > 0) {
      console.log(`  First result: ${searchResults[0].name} (${searchResults[0].type})`);
      console.log(`    ID: ${searchResults[0].id}`);
      console.log(`    Slug: ${searchResults[0].slug}`);
      console.log(`    Manufacturer: ${searchResults[0].manufacturer || "N/A"}`);
      console.log(`    Model: ${searchResults[0].model || "N/A"}`);
      console.log(`    Images: ${Array.isArray(searchResults[0].images) ? searchResults[0].images.length : 0}`);
    } else {
      console.log("  ⚠️  No hardware found in database (this is OK if database is empty)");
    }
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`);
    if (error.message.includes("DATABASE_URL")) {
      console.log("  ⚠️  Database not configured. Skipping database tests.");
    }
  }
  console.log();

  // Test 3: Hardware Review Content Generation (without OpenAI call)
  console.log("Test 3: Hardware Data Structure");
  const testHardwareData = {
    name: "NVIDIA GeForce RTX 4090",
    type: "gpu" as const,
    manufacturer: "NVIDIA",
    model: "RTX 4090",
    description: "High-end graphics card with 24GB GDDR6X memory",
    specs: {
      memory: "24GB GDDR6X",
      memoryBus: "384-bit",
      cudaCores: 16384,
      boostClock: "2520 MHz",
    },
  };

  console.log("  Test hardware data:");
  console.log(`    Name: ${testHardwareData.name}`);
  console.log(`    Type: ${testHardwareData.type}`);
  console.log(`    Manufacturer: ${testHardwareData.manufacturer}`);
  console.log(`    Model: ${testHardwareData.model}`);
  console.log(`    Description: ${testHardwareData.description}`);
  console.log(`    Specs: ${JSON.stringify(testHardwareData.specs, null, 2)}`);
  console.log();

  // Test 4: Generate Review Content (this will call OpenAI)
  console.log("Test 4: Generate Review Content (requires OpenAI API key)");
  try {
    const { generateHardwareReviewContent } = await import("../src/lib/review-generation");
    const result = await generateHardwareReviewContent(testHardwareData);
    console.log("  ✅ Review generation successful!");
    console.log(`    German Title: ${result.de.title}`);
    console.log(`    English Title: ${result.en.title}`);
    console.log(`    Score: ${result.score}`);
    console.log(`    German Pros: ${result.de.pros.length} items`);
    console.log(`    German Cons: ${result.de.cons.length} items`);
    console.log(`    Content length (DE): ${result.de.content.length} characters`);
    console.log(`    Content length (EN): ${result.en.content.length} characters`);
  } catch (error: any) {
    if (error.message.includes("API key") || error.message.includes("credentials") || error.message.includes("Missing credentials")) {
      console.log("  ⚠️  OpenAI API key not configured. Skipping content generation test.");
    } else {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }
  console.log();

  // Test 5: Create Hardware Entry
  console.log("Test 5: Create Hardware Entry");
  try {
    const newHardware = await createHardware({
      name: "Test GPU " + Date.now(),
      type: "gpu",
      manufacturer: "Test Manufacturer",
      model: "Test Model",
      description: "This is a test hardware entry",
      specs: { test: "spec" },
      images: [],
    });
    console.log(`  ✅ Hardware entry created: ${newHardware.id}`);
    console.log(`    Slug: ${newHardware.slug}`);
    console.log(`    Name: ${newHardware.name}`);
    
    // Clean up: Delete test entry
    const prisma = (await import("../src/lib/prisma")).default;
    await prisma.hardware.delete({ where: { id: newHardware.id } });
    console.log("  🧹 Test entry cleaned up");
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`);
    if (error.message.includes("DATABASE_URL") || error.message.includes("connect")) {
      console.log("  ⚠️  Database not configured. Skipping database write test.");
    }
  }

  console.log("\n✅ Hardware Review Generation Tests Complete!");
}

// Run tests
testHardwareReviewGeneration().catch(console.error);
