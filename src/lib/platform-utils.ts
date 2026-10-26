export const CANONICAL_PLATFORMS = [
  "PC",
  "PS5",
  "PS4",
  "Xbox Series",
  "Xbox One",
  "Switch",
] as const;

export type CanonicalPlatform = (typeof CANONICAL_PLATFORMS)[number];

export const PLATFORM_ALIASES: Record<string, CanonicalPlatform> = {
  pc: "PC",
  windows: "PC",
  steam: "PC",
  epic: "PC",
  gog: "PC",
  "playstation 5": "PS5",
  ps5: "PS5",
  "ps 5": "PS5",
  "playstation 4": "PS4",
  ps4: "PS4",
  "ps 4": "PS4",
  "xbox series x": "Xbox Series",
  "xbox series s": "Xbox Series",
  "xbox series": "Xbox Series",
  "xbox series x/s": "Xbox Series",
  "xbox one": "Xbox One",
  "xbox 1": "Xbox One",
  "nintendo switch": "Switch",
  switch: "Switch",
};

export function normalizePlatform(input: string): CanonicalPlatform | null {
  const key = input.toLowerCase().trim();
  return PLATFORM_ALIASES[key] ?? null;
}

export function mapPlatformsToHardwareTypes(platforms: CanonicalPlatform[]): string[] {
  const mapping: Record<CanonicalPlatform, string[]> = {
    PC: ["gpu", "cpu", "motherboard", "ram", "storage", "psu", "case", "cooler", "monitor", "keyboard", "mouse", "headset", "controller"],
    PS5: ["console"],
    PS4: ["console"],
    "Xbox Series": ["console"],
    "Xbox One": ["console"],
    Switch: ["console"],
  };
  return platforms.flatMap((p) => mapping[p] ?? []);
}

export function buildPlatformWhereClause(platforms: CanonicalPlatform[]) {
  if (!platforms.length) return {};

  const hardwareTypes = mapPlatformsToHardwareTypes(platforms);

  const orConditions: Array<Record<string, unknown>> = [
    { metadata: { path: "platforms", array_contains: platforms } },
  ];

  if (hardwareTypes.length > 0) {
    orConditions.push({ hardware: { type: { in: hardwareTypes } } });
  }

  return { OR: orConditions };
}