/**
 * Hardware Database - Static Data for Compatibility Checks
 * 
 * Contains known CPUs and GPUs with tier classifications and benchmark indices.
 * Used for autocomplete suggestions and bottleneck calculations.
 * 
 * Benchmark Indices are RELATIVE:
 * - CPU: Intel Core i5-12400 = 100 (baseline)
 * - GPU: NVIDIA GeForce RTX 3070 = 100 (baseline)
 */

import type { CpuEntry, GpuEntry } from '@/types/hardware';

// ============================================================================
// CPU DATABASE
// ============================================================================

export const CPU_DB: CpuEntry[] = [
  // Intel 14th Gen (Raptor Lake Refresh)
  { name: 'Intel Core i9-14900K', brand: 'intel', tier: 'enthusiast', cores: 24, threads: 32, baseClock: 3.2, boostClock: 6.0, tdp: 125, releaseYear: 2024, socket: 'LGA1700', benchmarkIndex: 210 },
  { name: 'Intel Core i7-14700K', brand: 'intel', tier: 'high', cores: 20, threads: 28, baseClock: 3.4, boostClock: 5.6, tdp: 125, releaseYear: 2024, socket: 'LGA1700', benchmarkIndex: 190 },
  { name: 'Intel Core i5-14600K', brand: 'intel', tier: 'high', cores: 14, threads: 20, baseClock: 3.5, boostClock: 5.3, tdp: 125, releaseYear: 2024, socket: 'LGA1700', benchmarkIndex: 165 },

  // Intel 13th Gen (Raptor Lake)
  { name: 'Intel Core i9-13900K', brand: 'intel', tier: 'enthusiast', cores: 24, threads: 32, baseClock: 3.0, boostClock: 5.8, tdp: 125, releaseYear: 2022, socket: 'LGA1700', benchmarkIndex: 200 },
  { name: 'Intel Core i7-13700K', brand: 'intel', tier: 'high', cores: 16, threads: 24, baseClock: 3.4, boostClock: 5.4, tdp: 125, releaseYear: 2022, socket: 'LGA1700', benchmarkIndex: 175 },
  { name: 'Intel Core i5-13600K', brand: 'intel', tier: 'high', cores: 14, threads: 20, baseClock: 3.5, boostClock: 5.1, tdp: 125, releaseYear: 2022, socket: 'LGA1700', benchmarkIndex: 155 },
  { name: 'Intel Core i5-13400', brand: 'intel', tier: 'mid', cores: 10, threads: 16, baseClock: 2.5, boostClock: 4.6, tdp: 65, releaseYear: 2023, socket: 'LGA1700', benchmarkIndex: 130 },
  { name: 'Intel Core i3-13100', brand: 'intel', tier: 'entry', cores: 4, threads: 8, baseClock: 3.4, boostClock: 4.5, tdp: 60, releaseYear: 2023, socket: 'LGA1700', benchmarkIndex: 95 },

  // Intel 12th Gen (Alder Lake)
  { name: 'Intel Core i9-12900K', brand: 'intel', tier: 'enthusiast', cores: 16, threads: 24, baseClock: 3.2, boostClock: 5.2, tdp: 125, releaseYear: 2021, socket: 'LGA1700', benchmarkIndex: 185 },
  { name: 'Intel Core i7-12700K', brand: 'intel', tier: 'high', cores: 12, threads: 20, baseClock: 3.6, boostClock: 5.0, tdp: 125, releaseYear: 2021, socket: 'LGA1700', benchmarkIndex: 160 },
  { name: 'Intel Core i5-12600K', brand: 'intel', tier: 'high', cores: 10, threads: 16, baseClock: 3.7, boostClock: 4.9, tdp: 125, releaseYear: 2021, socket: 'LGA1700', benchmarkIndex: 145 },
  { name: 'Intel Core i5-12400', brand: 'intel', tier: 'mid', cores: 6, threads: 12, baseClock: 2.5, boostClock: 4.4, tdp: 65, releaseYear: 2022, socket: 'LGA1700', benchmarkIndex: 100 }, // BASELINE
  { name: 'Intel Core i5-12400F', brand: 'intel', tier: 'mid', cores: 6, threads: 12, baseClock: 2.5, boostClock: 4.4, tdp: 65, releaseYear: 2022, socket: 'LGA1700', benchmarkIndex: 100 },
  { name: 'Intel Core i3-12100', brand: 'intel', tier: 'entry', cores: 4, threads: 8, baseClock: 3.3, boostClock: 4.3, tdp: 60, releaseYear: 2022, socket: 'LGA1700', benchmarkIndex: 85 },

  // Intel 11th Gen (Rocket Lake)
  { name: 'Intel Core i9-11900K', brand: 'intel', tier: 'high', cores: 8, threads: 16, baseClock: 3.5, boostClock: 5.3, tdp: 125, releaseYear: 2021, socket: 'LGA1200', benchmarkIndex: 140 },
  { name: 'Intel Core i7-11700K', brand: 'intel', tier: 'high', cores: 8, threads: 16, baseClock: 3.6, boostClock: 5.0, tdp: 125, releaseYear: 2021, socket: 'LGA1200', benchmarkIndex: 130 },
  { name: 'Intel Core i5-11600K', brand: 'intel', tier: 'mid', cores: 6, threads: 12, baseClock: 3.9, boostClock: 4.9, tdp: 125, releaseYear: 2021, socket: 'LGA1200', benchmarkIndex: 115 },
  { name: 'Intel Core i5-11400', brand: 'intel', tier: 'mid', cores: 6, threads: 12, baseClock: 2.6, boostClock: 4.4, tdp: 65, releaseYear: 2021, socket: 'LGA1200', benchmarkIndex: 100 },

  // Intel 10th Gen (Comet Lake)
  { name: 'Intel Core i9-10900K', brand: 'intel', tier: 'high', cores: 10, threads: 20, baseClock: 3.7, boostClock: 5.3, tdp: 125, releaseYear: 2020, socket: 'LGA1200', benchmarkIndex: 135 },
  { name: 'Intel Core i7-10700K', brand: 'intel', tier: 'high', cores: 8, threads: 16, baseClock: 3.8, boostClock: 5.1, tdp: 125, releaseYear: 2020, socket: 'LGA1200', benchmarkIndex: 125 },
  { name: 'Intel Core i5-10600K', brand: 'intel', tier: 'mid', cores: 6, threads: 12, baseClock: 4.1, boostClock: 4.8, tdp: 125, releaseYear: 2020, socket: 'LGA1200', benchmarkIndex: 110 },
  { name: 'Intel Core i5-10400', brand: 'intel', tier: 'mid', cores: 6, threads: 12, baseClock: 2.9, boostClock: 4.3, tdp: 65, releaseYear: 2020, socket: 'LGA1200', benchmarkIndex: 95 },

  // AMD Ryzen 9000 Series (Zen 5)
  { name: 'AMD Ryzen 9 9950X', brand: 'amd', tier: 'enthusiast', cores: 16, threads: 32, baseClock: 4.3, boostClock: 5.7, tdp: 170, releaseYear: 2024, socket: 'AM5', benchmarkIndex: 220 },
  { name: 'AMD Ryzen 9 9900X', brand: 'amd', tier: 'enthusiast', cores: 12, threads: 24, baseClock: 4.4, boostClock: 5.6, tdp: 120, releaseYear: 2024, socket: 'AM5', benchmarkIndex: 200 },
  { name: 'AMD Ryzen 7 9700X', brand: 'amd', tier: 'high', cores: 8, threads: 16, baseClock: 3.8, boostClock: 5.5, tdp: 65, releaseYear: 2024, socket: 'AM5', benchmarkIndex: 175 },
  { name: 'AMD Ryzen 5 9600X', brand: 'amd', tier: 'high', cores: 6, threads: 12, baseClock: 3.9, boostClock: 5.4, tdp: 65, releaseYear: 2024, socket: 'AM5', benchmarkIndex: 155 },

  // AMD Ryzen 7000 Series (Zen 4)
  { name: 'AMD Ryzen 9 7950X', brand: 'amd', tier: 'enthusiast', cores: 16, threads: 32, baseClock: 4.5, boostClock: 5.7, tdp: 170, releaseYear: 2022, socket: 'AM5', benchmarkIndex: 205 },
  { name: 'AMD Ryzen 9 7900X', brand: 'amd', tier: 'enthusiast', cores: 12, threads: 24, baseClock: 4.7, boostClock: 5.6, tdp: 170, releaseYear: 2022, socket: 'AM5', benchmarkIndex: 190 },
  { name: 'AMD Ryzen 7 7800X3D', brand: 'amd', tier: 'enthusiast', cores: 8, threads: 16, baseClock: 4.2, boostClock: 5.0, tdp: 120, releaseYear: 2023, socket: 'AM5', benchmarkIndex: 185 },
  { name: 'AMD Ryzen 7 7700X', brand: 'amd', tier: 'high', cores: 8, threads: 16, baseClock: 4.5, boostClock: 5.4, tdp: 105, releaseYear: 2022, socket: 'AM5', benchmarkIndex: 170 },
  { name: 'AMD Ryzen 5 7600X', brand: 'amd', tier: 'high', cores: 6, threads: 12, baseClock: 4.7, boostClock: 5.3, tdp: 105, releaseYear: 2022, socket: 'AM5', benchmarkIndex: 150 },
  { name: 'AMD Ryzen 5 7600', brand: 'amd', tier: 'mid', cores: 6, threads: 12, baseClock: 3.8, boostClock: 5.1, tdp: 65, releaseYear: 2023, socket: 'AM5', benchmarkIndex: 135 },

  // AMD Ryzen 5000 Series (Zen 3)
  { name: 'AMD Ryzen 9 5950X', brand: 'amd', tier: 'enthusiast', cores: 16, threads: 32, baseClock: 3.4, boostClock: 4.9, tdp: 105, releaseYear: 2020, socket: 'AM4', benchmarkIndex: 180 },
  { name: 'AMD Ryzen 9 5900X', brand: 'amd', tier: 'enthusiast', cores: 12, threads: 24, baseClock: 3.7, boostClock: 4.8, tdp: 105, releaseYear: 2020, socket: 'AM4', benchmarkIndex: 165 },
  { name: 'AMD Ryzen 7 5800X3D', brand: 'amd', tier: 'enthusiast', cores: 8, threads: 16, baseClock: 3.4, boostClock: 4.5, tdp: 105, releaseYear: 2022, socket: 'AM4', benchmarkIndex: 160 },
  { name: 'AMD Ryzen 7 5800X', brand: 'amd', tier: 'high', cores: 8, threads: 16, baseClock: 3.8, boostClock: 4.7, tdp: 105, releaseYear: 2020, socket: 'AM4', benchmarkIndex: 145 },
  { name: 'AMD Ryzen 5 5600X', brand: 'amd', tier: 'high', cores: 6, threads: 12, baseClock: 3.7, boostClock: 4.6, tdp: 65, releaseYear: 2020, socket: 'AM4', benchmarkIndex: 130 },
  { name: 'AMD Ryzen 5 5600', brand: 'amd', tier: 'mid', cores: 6, threads: 12, baseClock: 3.5, boostClock: 4.4, tdp: 65, releaseYear: 2022, socket: 'AM4', benchmarkIndex: 120 },
  { name: 'AMD Ryzen 5 5500', brand: 'amd', tier: 'mid', cores: 6, threads: 12, baseClock: 3.6, boostClock: 4.2, tdp: 65, releaseYear: 2022, socket: 'AM4', benchmarkIndex: 110 },

  // Older but still common
  { name: 'AMD Ryzen 7 3700X', brand: 'amd', tier: 'mid', cores: 8, threads: 16, baseClock: 3.6, boostClock: 4.4, tdp: 65, releaseYear: 2019, socket: 'AM4', benchmarkIndex: 115 },
  { name: 'AMD Ryzen 5 3600', brand: 'amd', tier: 'mid', cores: 6, threads: 12, baseClock: 3.6, boostClock: 4.2, tdp: 65, releaseYear: 2019, socket: 'AM4', benchmarkIndex: 100 },
  { name: 'AMD Ryzen 5 3600X', brand: 'amd', tier: 'mid', cores: 6, threads: 12, baseClock: 3.8, boostClock: 4.4, tdp: 95, releaseYear: 2019, socket: 'AM4', benchmarkIndex: 105 },
];

// ============================================================================
// GPU DATABASE
// ============================================================================

export const GPU_DB: GpuEntry[] = [
  // NVIDIA RTX 40 Series (Ada Lovelace)
  { name: 'NVIDIA GeForce RTX 4090', brand: 'nvidia', tier: 'enthusiast', vram: 24, vramType: 'GDDR6X', tdp: 450, releaseYear: 2022, benchmarkIndex: 280 },
  { name: 'NVIDIA GeForce RTX 4080 Super', brand: 'nvidia', tier: 'enthusiast', vram: 16, vramType: 'GDDR6X', tdp: 320, releaseYear: 2024, benchmarkIndex: 235 },
  { name: 'NVIDIA GeForce RTX 4080', brand: 'nvidia', tier: 'enthusiast', vram: 16, vramType: 'GDDR6X', tdp: 320, releaseYear: 2022, benchmarkIndex: 225 },
  { name: 'NVIDIA GeForce RTX 4070 Ti Super', brand: 'nvidia', tier: 'high', vram: 16, vramType: 'GDDR6X', tdp: 285, releaseYear: 2024, benchmarkIndex: 200 },
  { name: 'NVIDIA GeForce RTX 4070 Ti', brand: 'nvidia', tier: 'high', vram: 12, vramType: 'GDDR6X', tdp: 285, releaseYear: 2023, benchmarkIndex: 190 },
  { name: 'NVIDIA GeForce RTX 4070 Super', brand: 'nvidia', tier: 'high', vram: 12, vramType: 'GDDR6X', tdp: 220, releaseYear: 2024, benchmarkIndex: 175 },
  { name: 'NVIDIA GeForce RTX 4070', brand: 'nvidia', tier: 'high', vram: 12, vramType: 'GDDR6X', tdp: 200, releaseYear: 2023, benchmarkIndex: 165 },
  { name: 'NVIDIA GeForce RTX 4060 Ti 16GB', brand: 'nvidia', tier: 'mid', vram: 16, vramType: 'GDDR6', tdp: 165, releaseYear: 2024, benchmarkIndex: 140 },
  { name: 'NVIDIA GeForce RTX 4060 Ti 8GB', brand: 'nvidia', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 160, releaseYear: 2023, benchmarkIndex: 135 },
  { name: 'NVIDIA GeForce RTX 4060', brand: 'nvidia', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 115, releaseYear: 2023, benchmarkIndex: 120 },

  // NVIDIA RTX 30 Series (Ampere)
  { name: 'NVIDIA GeForce RTX 3090 Ti', brand: 'nvidia', tier: 'enthusiast', vram: 24, vramType: 'GDDR6X', tdp: 450, releaseYear: 2022, benchmarkIndex: 240 },
  { name: 'NVIDIA GeForce RTX 3090', brand: 'nvidia', tier: 'enthusiast', vram: 24, vramType: 'GDDR6X', tdp: 350, releaseYear: 2020, benchmarkIndex: 220 },
  { name: 'NVIDIA GeForce RTX 3080 Ti', brand: 'nvidia', tier: 'enthusiast', vram: 12, vramType: 'GDDR6X', tdp: 350, releaseYear: 2022, benchmarkIndex: 210 },
  { name: 'NVIDIA GeForce RTX 3080 12GB', brand: 'nvidia', tier: 'high', vram: 12, vramType: 'GDDR6X', tdp: 350, releaseYear: 2022, benchmarkIndex: 195 },
  { name: 'NVIDIA GeForce RTX 3080 10GB', brand: 'nvidia', tier: 'high', vram: 10, vramType: 'GDDR6X', tdp: 320, releaseYear: 2020, benchmarkIndex: 185 },
  { name: 'NVIDIA GeForce RTX 3070 Ti', brand: 'nvidia', tier: 'high', vram: 8, vramType: 'GDDR6X', tdp: 290, releaseYear: 2021, benchmarkIndex: 165 },
  { name: 'NVIDIA GeForce RTX 3070', brand: 'nvidia', tier: 'high', vram: 8, vramType: 'GDDR6', tdp: 220, releaseYear: 2020, benchmarkIndex: 150 }, // BASELINE (100)
  { name: 'NVIDIA GeForce RTX 3060 Ti', brand: 'nvidia', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 200, releaseYear: 2020, benchmarkIndex: 135 },
  { name: 'NVIDIA GeForce RTX 3060 12GB', brand: 'nvidia', tier: 'mid', vram: 12, vramType: 'GDDR6', tdp: 170, releaseYear: 2021, benchmarkIndex: 120 },
  { name: 'NVIDIA GeForce RTX 3050', brand: 'nvidia', tier: 'entry', vram: 8, vramType: 'GDDR6', tdp: 130, releaseYear: 2022, benchmarkIndex: 85 },

  // NVIDIA RTX 20 Series (Turing)
  { name: 'NVIDIA GeForce RTX 2080 Ti', brand: 'nvidia', tier: 'enthusiast', vram: 11, vramType: 'GDDR6', tdp: 250, releaseYear: 2018, benchmarkIndex: 170 },
  { name: 'NVIDIA GeForce RTX 2080 Super', brand: 'nvidia', tier: 'high', vram: 8, vramType: 'GDDR6', tdp: 250, releaseYear: 2019, benchmarkIndex: 145 },
  { name: 'NVIDIA GeForce RTX 2080', brand: 'nvidia', tier: 'high', vram: 8, vramType: 'GDDR6', tdp: 215, releaseYear: 2018, benchmarkIndex: 140 },
  { name: 'NVIDIA GeForce RTX 2070 Super', brand: 'nvidia', tier: 'high', vram: 8, vramType: 'GDDR6', tdp: 215, releaseYear: 2019, benchmarkIndex: 130 },
  { name: 'NVIDIA GeForce RTX 2070', brand: 'nvidia', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 175, releaseYear: 2018, benchmarkIndex: 120 },
  { name: 'NVIDIA GeForce RTX 2060 Super', brand: 'nvidia', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 175, releaseYear: 2019, benchmarkIndex: 115 },
  { name: 'NVIDIA GeForce RTX 2060', brand: 'nvidia', tier: 'mid', vram: 6, vramType: 'GDDR6', tdp: 160, releaseYear: 2019, benchmarkIndex: 105 },

  // AMD RX 7000 Series (RDNA 3)
  { name: 'AMD Radeon RX 7900 XTX', brand: 'amd', tier: 'enthusiast', vram: 24, vramType: 'GDDR6', tdp: 355, releaseYear: 2022, benchmarkIndex: 250 },
  { name: 'AMD Radeon RX 7900 XT', brand: 'amd', tier: 'enthusiast', vram: 20, vramType: 'GDDR6', tdp: 315, releaseYear: 2022, benchmarkIndex: 220 },
  { name: 'AMD Radeon RX 7900 GRE', brand: 'amd', tier: 'high', vram: 16, vramType: 'GDDR6', tdp: 260, releaseYear: 2023, benchmarkIndex: 185 },
  { name: 'AMD Radeon RX 7800 XT', brand: 'amd', tier: 'high', vram: 16, vramType: 'GDDR6', tdp: 263, releaseYear: 2023, benchmarkIndex: 175 },
  { name: 'AMD Radeon RX 7700 XT', brand: 'amd', tier: 'high', vram: 12, vramType: 'GDDR6', tdp: 245, releaseYear: 2023, benchmarkIndex: 160 },
  { name: 'AMD Radeon RX 7600', brand: 'amd', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 165, releaseYear: 2023, benchmarkIndex: 125 },

  // AMD RX 6000 Series (RDNA 2)
  { name: 'AMD Radeon RX 6950 XT', brand: 'amd', tier: 'enthusiast', vram: 16, vramType: 'GDDR6', tdp: 335, releaseYear: 2022, benchmarkIndex: 210 },
  { name: 'AMD Radeon RX 6900 XT', brand: 'amd', tier: 'enthusiast', vram: 16, vramType: 'GDDR6', tdp: 300, releaseYear: 2020, benchmarkIndex: 200 },
  { name: 'AMD Radeon RX 6800 XT', brand: 'amd', tier: 'high', vram: 16, vramType: 'GDDR6', tdp: 300, releaseYear: 2020, benchmarkIndex: 185 },
  { name: 'AMD Radeon RX 6800', brand: 'amd', tier: 'high', vram: 16, vramType: 'GDDR6', tdp: 250, releaseYear: 2020, benchmarkIndex: 170 },
  { name: 'AMD Radeon RX 6750 XT', brand: 'amd', tier: 'high', vram: 12, vramType: 'GDDR6', tdp: 250, releaseYear: 2022, benchmarkIndex: 155 },
  { name: 'AMD Radeon RX 6700 XT', brand: 'amd', tier: 'mid', vram: 12, vramType: 'GDDR6', tdp: 230, releaseYear: 2021, benchmarkIndex: 140 },
  { name: 'AMD Radeon RX 6650 XT', brand: 'amd', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 180, releaseYear: 2022, benchmarkIndex: 125 },
  { name: 'AMD Radeon RX 6600 XT', brand: 'amd', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 160, releaseYear: 2021, benchmarkIndex: 115 },
  { name: 'AMD Radeon RX 6600', brand: 'amd', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 132, releaseYear: 2021, benchmarkIndex: 105 },
  { name: 'AMD Radeon RX 6500 XT', brand: 'amd', tier: 'entry', vram: 4, vramType: 'GDDR6', tdp: 107, releaseYear: 2022, benchmarkIndex: 75 },

  // AMD RX 5000 Series (RDNA 1)
  { name: 'AMD Radeon RX 5700 XT', brand: 'amd', tier: 'high', vram: 8, vramType: 'GDDR6', tdp: 225, releaseYear: 2019, benchmarkIndex: 130 },
  { name: 'AMD Radeon RX 5700', brand: 'amd', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 180, releaseYear: 2019, benchmarkIndex: 115 },
  { name: 'AMD Radeon RX 5600 XT', brand: 'amd', tier: 'mid', vram: 6, vramType: 'GDDR6', tdp: 150, releaseYear: 2020, benchmarkIndex: 100 },

  // Intel Arc
  { name: 'Intel Arc A770 16GB', brand: 'intel', tier: 'high', vram: 16, vramType: 'GDDR6', tdp: 225, releaseYear: 2022, benchmarkIndex: 145 },
  { name: 'Intel Arc A770 8GB', brand: 'intel', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 225, releaseYear: 2022, benchmarkIndex: 135 },
  { name: 'Intel Arc A750', brand: 'intel', tier: 'mid', vram: 8, vramType: 'GDDR6', tdp: 225, releaseYear: 2022, benchmarkIndex: 125 },
  { name: 'Intel Arc A580', brand: 'intel', tier: 'entry', vram: 8, vramType: 'GDDR6', tdp: 175, releaseYear: 2023, benchmarkIndex: 100 },
  { name: 'Intel Arc A380', brand: 'intel', tier: 'entry', vram: 6, vramType: 'GDDR6', tdp: 75, releaseYear: 2022, benchmarkIndex: 60 },
];

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Fuzzy search for CPU by name (case-insensitive, partial match)
 */
export function searchCpu(query: string): CpuEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  return CPU_DB
    .filter(cpu => cpu.name.toLowerCase().includes(q))
    .sort((a, b) => {
      // Exact match first, then by tier (enthusiast first), then by benchmark
      const aExact = a.name.toLowerCase() === q;
      const bExact = b.name.toLowerCase() === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const tierOrder = { enthusiast: 4, high: 3, mid: 2, entry: 1 };
      const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
      if (tierDiff !== 0) return tierDiff;
      
      return b.benchmarkIndex - a.benchmarkIndex;
    })
    .slice(0, 10);
}

/**
 * Fuzzy search for GPU by name (case-insensitive, partial match)
 */
export function searchGpu(query: string): GpuEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  return GPU_DB
    .filter(gpu => gpu.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aExact = a.name.toLowerCase() === q;
      const bExact = b.name.toLowerCase() === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const tierOrder = { enthusiast: 4, high: 3, mid: 2, entry: 1 };
      const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
      if (tierDiff !== 0) return tierDiff;
      
      return b.benchmarkIndex - a.benchmarkIndex;
    })
    .slice(0, 10);
}

/**
 * Get CPU by exact name (case-insensitive)
 */
export function getCpuByName(name: string): CpuEntry | undefined {
  return CPU_DB.find(cpu => cpu.name.toLowerCase() === name.toLowerCase().trim());
}

/**
 * Get GPU by exact name (case-insensitive)
 */
export function getGpuByName(name: string): GpuEntry | undefined {
  return GPU_DB.find(gpu => gpu.name.toLowerCase() === name.toLowerCase().trim());
}

/**
 * Get CPU tier from name (for bottleneck calculation)
 */
export function getCpuTier(cpuName: string): 'entry' | 'mid' | 'high' | 'enthusiast' | 'unknown' {
  const cpu = getCpuByName(cpuName);
  return cpu?.tier ?? 'unknown';
}

/**
 * Get GPU tier from name (for bottleneck calculation)
 */
export function getGpuTier(gpuName: string): 'entry' | 'mid' | 'high' | 'enthusiast' | 'unknown' {
  const gpu = getGpuByName(gpuName);
  return gpu?.tier ?? 'unknown';
}

/**
 * Calculate CPU bottleneck factor relative to GPU.
 * Returns a factor 0.5 - 1.0 where 1.0 = no bottleneck, lower = CPU limits GPU.
 * 
 * Heuristic: Compare tier difference and benchmark indices.
 * If CPU tier is 2+ levels below GPU tier -> significant bottleneck.
 */
export function getCpuBottleneckFactor(cpuName: string, gpuName: string): number {
  const cpu = getCpuByName(cpuName);
  const gpu = getGpuByName(gpuName);
  
  if (!cpu || !gpu) {
    // Unknown hardware: assume moderate bottleneck
    return 0.85;
  }
  
  const tierOrder = { entry: 1, mid: 2, high: 3, enthusiast: 4 };
  const cpuTier = tierOrder[cpu.tier];
  const gpuTier = tierOrder[gpu.tier];
  const tierDiff = gpuTier - cpuTier;
  
  // Benchmark-based factor (more accurate)
  const benchFactor = Math.min(1.0, cpu.benchmarkIndex / (gpu.benchmarkIndex * 0.8));
  
  // Tier-based adjustment
  let tierFactor = 1.0;
  if (tierDiff >= 2) tierFactor = 0.75;      // GPU 2+ tiers above CPU
  else if (tierDiff === 1) tierFactor = 0.9; // GPU 1 tier above CPU
  else if (tierDiff <= -1) tierFactor = 1.0; // CPU >= GPU tier (no bottleneck)
  
  // Combine: use the more conservative (lower) factor
  const factor = Math.min(benchFactor, tierFactor);
  
  // Clamp to reasonable range
  return Math.max(0.5, Math.min(1.0, factor));
}

/**
 * Get RAM tier factor (affects minimum FPS, 1% lows)
 */
export function getRamFactor(ramString: string): number {
  const ramGb = parseInt(ramString.match(/(\d+)\s*GB/i)?.[1] || '16', 10);
  const isDdr5 = /DDR5/i.test(ramString);
  
  if (ramGb >= 32) return isDdr5 ? 1.05 : 1.02;
  if (ramGb >= 16) return isDdr5 ? 1.02 : 1.0;
  if (ramGb >= 8) return 0.95;  // Slight penalty for 8GB in modern games
  return 0.85; // < 8GB significant penalty
}

/**
 * Get PSU headroom factor (warning only, doesn't affect FPS)
 */
export function getPsuHeadroom(psuString: string, cpuTdp: number, gpuTdp: number): { sufficient: boolean; headroom: number } {
  const psuWatt = parseInt(psuString.match(/(\d+)\s*W/i)?.[1] || '0', 10);
  if (psuWatt === 0) return { sufficient: true, headroom: 0 }; // Unknown = assume OK
  
  const estimatedLoad = cpuTdp + gpuTdp + 100; // +100W for rest of system
  const headroom = (psuWatt - estimatedLoad) / psuWatt;
  
  return {
    sufficient: headroom >= 0.15, // 15% headroom minimum
    headroom: Math.max(0, headroom)
  };
}

/**
 * Get all CPU names for autocomplete
 */
export function getAllCpuNames(): string[] {
  return CPU_DB.map(c => c.name).sort();
}

/**
 * Get all GPU names for autocomplete
 */
export function getAllGpuNames(): string[] {
  return GPU_DB.map(g => g.name).sort();
}

// Re-export types
export type { CpuEntry, GpuEntry } from '@/types/hardware';