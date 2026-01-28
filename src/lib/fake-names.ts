/**
 * Fake name generator for AI-generated comments.
 * Provides realistic German first and last names.
 */

const FIRST_NAMES_DE = [
  "Maximilian",
  "Alexander",
  "Paul",
  "Leon",
  "Finn",
  "Elias",
  "Noah",
  "Ben",
  "Lukas",
  "Jonas",
  "Lisa",
  "Anna",
  "Laura",
  "Julia",
  "Sarah",
  "Sophie",
  "Emma",
  "Lena",
  "Marie",
  "Katharina",
  "Michael",
  "Thomas",
  "Stefan",
  "Daniel",
  "Andreas",
  "Christina",
  "Sabine",
  "Petra",
  "Claudia",
  "Jennifer",
];

const LAST_NAMES_DE = [
  "Müller",
  "Schmidt",
  "Schneider",
  "Fischer",
  "Weber",
  "Meyer",
  "Wagner",
  "Becker",
  "Schulz",
  "Hoffmann",
  "Koch",
  "Richter",
  "Klein",
  "Wolf",
  "Schröder",
  "Neumann",
  "Schwarz",
  "Zimmermann",
  "Braun",
  "Krüger",
  "Hartmann",
  "Lange",
  "Schmitt",
  "Werner",
  "Schmid",
  "Krause",
  "Meier",
  "Lehmann",
  "Huber",
  "Herrmann",
];

/**
 * Generates a random German-sounding fake name for comment authors.
 * @returns Full name, e.g. "Maximilian Schmidt"
 */
export function generateFakeName(): string {
  const first = FIRST_NAMES_DE[Math.floor(Math.random() * FIRST_NAMES_DE.length)];
  const last = LAST_NAMES_DE[Math.floor(Math.random() * LAST_NAMES_DE.length)];
  return `${first} ${last}`;
}
