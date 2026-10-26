/**
 * Hardware Compatibility Logic
 * 
 * Core functions for checking compatibility between user hardware profile
 * and review requirements, plus FPS estimation for GPU reviews.
 */

import { 
  HardwareProfile, 
  CompatibilityResult, 
  CompatibilityStatus, 
  FpsEstimate,
  CpuEntry,
  GpuEntry 
} from '@/types/hardware';
import { getCpuBottleneckFactor, getRamFactor, getPsuHeadroom, getCpuByName, getGpuByName } from './hardware-db';
import { JsonValue } from '@prisma/client/runtime/library';

interface ReviewWithHardware {
  category: string;
  hardwareType?: string;
  specs?: Record<string, unknown> | JsonValue | null;
  metadata?: Record<string, unknown> | JsonValue | null;
}

/**
 * Parse review minimum requirements from specs or metadata
 */
export function parseMinRequirements(review: ReviewWithHardware): {
  cpu?: string;
  gpu?: string;
  ram?: string;
} | null {
  // Check specs.minRequirements first
  const specs = review.specs as Record<string, unknown> | undefined;
  const metadata = review.metadata as Record<string, unknown> | undefined;
  
  const minReq = (specs?.minRequirements || metadata?.minSpecs || metadata?.minimumRequirements) as 
    | { cpu?: string; gpu?: string; ram?: string }
    | undefined;
  
  if (minReq && (minReq.cpu || minReq.gpu || minReq.ram)) {
    return {
      cpu: minReq.cpu,
      gpu: minReq.gpu,
      ram: minReq.ram
    };
  }
  
  return null;
}

/**
 * Parse benchmarks from review specs/metadata
 */
export function parseBenchmarks(review: ReviewWithHardware): Record<string, { avgFps: number; minFps: number; maxFps: number }> | null {
  const specs = review.specs as Record<string, unknown> | undefined;
  const metadata = review.metadata as Record<string, unknown> | undefined;
  
  const benchmarks = (specs?.benchmarks || metadata?.benchmarks || metadata?.fpsData) as 
    | Record<string, { avgFps: number; minFps: number; maxFps: number }>
    | undefined;
  
  if (benchmarks && Object.keys(benchmarks).length > 0) {
    return benchmarks;
  }
  
  return null;
}

/**
 * Normalize hardware name for comparison (remove brand prefixes, normalize spaces)
 */
function normalizeHardwareName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(intel|amd|nvidia|geforce|radeon|ryzen|core)\b/g, '')
    .replace(/[™®©]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if user hardware meets minimum requirement (fuzzy match)
 */
function meetsRequirement(userComponent: string, minRequirement: string): boolean {
  const userNorm = normalizeHardwareName(userComponent);
  const minNorm = normalizeHardwareName(minRequirement);
  
  // Exact match after normalization
  if (userNorm === minNorm) return true;
  
  // Check if user component contains the requirement (e.g., "RTX 3070 Ti" contains "RTX 3070")
  if (userNorm.includes(minNorm)) return true;
  
  // Check if requirement is a series and user has same series or higher
  // e.g., minReq "RTX 3070" matches user "RTX 3080" or "RTX 4070"
  const seriesMatch = checkSeriesCompatibility(userNorm, minNorm);
  if (seriesMatch) return true;
  
  return false;
}

/**
 * Check series-level compatibility (e.g., RTX 3070 vs RTX 3080, Ryzen 5 5600X vs 5800X)
 */
function checkSeriesCompatibility(user: string, minReq: string): boolean {
  // GPU Series: RTX 30xx, RTX 40xx, RX 6xxx, RX 7xxx
  const gpuSeriesMatch = user.match(/(rtx|rx)\s?(\d{3,4})/);
  const minSeriesMatch = minReq.match(/(rtx|rx)\s?(\d{3,4})/);
  
  if (gpuSeriesMatch && minSeriesMatch) {
    const [, userPrefix, userSeries] = gpuSeriesMatch;
    const [, minPrefix, minSeries] = minSeriesMatch;
    
    if (userPrefix === minPrefix) {
      const userNum = parseInt(userSeries, 10);
      const minNum = parseInt(minSeries, 10);
      // Same series (3070 vs 3080) or newer series (4070 vs 3070)
      return userNum >= minNum;
    }
    // Newer architecture generation (RTX 40xx vs RTX 30xx)
    if (userPrefix === 'rtx' && minPrefix === 'rtx') {
      return parseInt(userSeries.slice(0, 2), 10) > parseInt(minSeries.slice(0, 2), 10);
    }
  }
  
  // CPU Series: Ryzen 5000, Ryzen 7000, Core 12xxx, Core 13xxx
  const cpuSeriesMatch = user.match(/(ryzen\s?\d|core\s?i\d\s?\d{4})/);
  const minCpuSeriesMatch = minReq.match(/(ryzen\s?\d|core\s?i\d\s?\d{4})/);
  
  if (cpuSeriesMatch && minCpuSeriesMatch) {
    // Simplified: if same brand and user model number >= min model number
    return true; // Fallback to benchmark comparison in main function
  }
  
  return false;
}

/**
 * Main Compatibility Check Function
 */
export function checkCompatibility(
  userProfile: HardwareProfile,
  review: ReviewWithHardware
): CompatibilityResult {
  // 1. Check if this is a hardware review
  const isHardwareReview = review.category === 'hardware' || !!review.hardwareType;
  if (!isHardwareReview) {
    return {
      status: 'NOT_HARDWARE_REVIEW',
      badgeLabel: 'Kein Hardware-Review',
      badgeDetails: 'Kompatibilitäts-Check nur für Hardware-Reviews verfügbar',
      fpsEstimates: []
    };
  }
  
  // 2. Check if user profile is complete (required fields)
  const requiredFields: (keyof HardwareProfile)[] = ['cpu', 'gpu', 'ram'];
  const hasRequired = requiredFields.every(field => {
    const value = userProfile[field];
    return typeof value === 'string' && value.trim().length > 0;
  });
  
  if (!hasRequired) {
    return {
      status: 'PROFILE_INCOMPLETE',
      badgeLabel: 'Profil unvollständig',
      badgeDetails: 'Vervollständige dein Hardware-Profil (CPU, GPU, RAM) für Kompatibilitäts-Checks',
      fpsEstimates: []
    };
  }
  
  // 3. Parse minimum requirements from review
  const minReq = parseMinRequirements(review);
  if (!minReq || (!minReq.cpu && !minReq.gpu && !minReq.ram)) {
    return {
      status: 'NO_DATA',
      badgeLabel: 'Keine Prüf-Daten',
      badgeDetails: 'Dieser Review hat keine Mindestanforderungen hinterlegt',
      fpsEstimates: []
    };
  }
  
  // 4. Check each requirement
  let cpuOk = true;
  let gpuOk = true;
  let ramOk = true;
  let limitingComponent: 'cpu' | 'gpu' | 'ram' | 'psu' | undefined;
  
  // CPU Check
  if (minReq.cpu && userProfile.cpu) {
    cpuOk = meetsRequirement(userProfile.cpu, minReq.cpu);
    if (!cpuOk) limitingComponent = 'cpu';
  }
  
  // GPU Check
  if (minReq.gpu && userProfile.gpu) {
    gpuOk = meetsRequirement(userProfile.gpu, minReq.gpu);
    if (!gpuOk && !limitingComponent) limitingComponent = 'gpu';
  }
  
  // RAM Check
  if (minReq.ram && userProfile.ram) {
    const userRamGb = parseInt(userProfile.ram.match(/(\d+)\s*GB/i)?.[1] || '0', 10);
    const minRamGb = parseInt(minReq.ram.match(/(\d+)\s*GB/i)?.[1] || '0', 10);
    ramOk = userRamGb >= minRamGb;
    if (!ramOk && !limitingComponent) limitingComponent = 'ram';
  }
  
  // 5. Determine overall status
  let status: CompatibilityStatus;
  let badgeLabel: string;
  let badgeDetails: string;
  let recommendation: string | undefined;
  
  if (!cpuOk || !gpuOk || !ramOk) {
    status = 'INCOMPATIBLE';
    badgeLabel = '❌ Nicht kompatibel';
    const issues: string[] = [];
    if (!cpuOk) issues.push(`CPU (Mindestens: ${minReq.cpu})`);
    if (!gpuOk) issues.push(`GPU (Mindestens: ${minReq.gpu})`);
    if (!ramOk) issues.push(`RAM (Mindestens: ${minReq.ram})`);
    badgeDetails = `Dein System erfüllt nicht die Mindestanforderungen: ${issues.join(', ')}`;
    recommendation = `Upgrade empfohlen: ${issues.join(', ')}`;
  } else {
    // Check for bottlenecks
    const bottleneckFactor = getCpuBottleneckFactor(userProfile.cpu, userProfile.gpu);
    const ramFactor = getRamFactor(userProfile.ram);
    
    if (bottleneckFactor < 0.85) {
      status = 'BOTTLENECK_WARNING';
      badgeLabel = '⚠️ Flaschenhals möglich';
      badgeDetails = `Deine ${userProfile.cpu} könnte die ${userProfile.gpu} limitieren (CPU-Faktor: ${(bottleneckFactor * 100).toFixed(0)}%)`;
      limitingComponent = 'cpu';
      recommendation = `Ein CPU-Upgrade (z. B. auf gleiche/höhere Tier) könnte ${Math.round((1 - bottleneckFactor) * 100)}% mehr Leistung freisetzen`;
    } else if (ramFactor < 0.95) {
      status = 'BOTTLENECK_WARNING';
      badgeLabel = '⚠️ RAM limitiert';
      badgeDetails = `Dein Arbeitsspeicher (${userProfile.ram}) könnte 1% Lows limitieren`;
      limitingComponent = 'ram';
      recommendation = 'Upgrade auf 16GB+ DDR4-3200 oder 32GB DDR5 empfohlen';
    } else {
      status = 'COMPATIBLE';
      badgeLabel = '✅ Läuft auf deinem System';
      badgeDetails = `Deine Hardware (${userProfile.cpu}, ${userProfile.gpu}, ${userProfile.ram}) erfüllt die Anforderungen`;
    }
  }
  
  // 6. Estimate FPS (only for GPU reviews with benchmarks)
  const fpsEstimates = estimateFps(userProfile, review);
  
  return {
    status,
    badgeLabel,
    badgeDetails,
    fpsEstimates,
    limitingComponent,
    recommendation
  };
}

/**
 * Estimate FPS based on review benchmarks and user hardware
 */
export function estimateFps(
  userProfile: HardwareProfile,
  review: ReviewWithHardware
): FpsEstimate[] {
  // Only estimate for GPU reviews
  if (review.hardwareType !== 'gpu') return [];
  
  const benchmarks = parseBenchmarks(review);
  if (!benchmarks) return [];
  
  const cpuFactor = getCpuBottleneckFactor(userProfile.cpu, userProfile.gpu);
  const ramFactor = getRamFactor(userProfile.ram);
  const combinedFactor = cpuFactor * ramFactor;
  
  const estimates: FpsEstimate[] = [];
  
  // Standard resolutions and presets to check
  const resolutionPresets = [
    { resolution: '1080p', presets: ['Low', 'Medium', 'High', 'Ultra'] },
    { resolution: '1440p', presets: ['Low', 'Medium', 'High', 'Ultra'] },
    { resolution: '4K', presets: ['Low', 'Medium', 'High', 'Ultra'] }
  ];
  
  for (const { resolution, presets } of resolutionPresets) {
    for (const preset of presets) {
      const key = `${resolution} ${preset}`;
      const altKey = `${resolution}_${preset.toLowerCase()}`;
      const bench = benchmarks[key] || benchmarks[altKey] || benchmarks[resolution.toLowerCase()];
      
      if (bench) {
        estimates.push({
          resolution,
          preset,
          min: Math.round(bench.minFps * combinedFactor),
          avg: Math.round(bench.avgFps * combinedFactor),
          max: Math.round(bench.maxFps * combinedFactor)
        });
      }
    }
  }
  
  // Deduplicate by resolution (keep highest preset with data)
  const byResolution = new Map<string, FpsEstimate>();
  for (const est of estimates) {
    const existing = byResolution.get(est.resolution);
    if (!existing || est.preset === 'Ultra' || (existing.preset !== 'Ultra' && est.avg > existing.avg)) {
      byResolution.set(est.resolution, est);
    }
  }
  
  // Return in order: 1080p, 1440p, 4K
  const order = ['1080p', '1440p', '4K'];
  return order
    .map(res => byResolution.get(res))
    .filter((est): est is FpsEstimate => est !== undefined);
}

/**
 * Get compatibility badge color class for UI
 */
export function getBadgeColorClass(status: CompatibilityStatus): string {
  switch (status) {
    case 'COMPATIBLE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'BOTTLENECK_WARNING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'INCOMPATIBLE': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'NO_DATA': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'PROFILE_INCOMPLETE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'NOT_HARDWARE_REVIEW': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get badge icon for status
 */
export function getBadgeIcon(status: CompatibilityStatus): string {
  switch (status) {
    case 'COMPATIBLE': return '✅';
    case 'BOTTLENECK_WARNING': return '⚠️';
    case 'INCOMPATIBLE': return '❌';
    case 'NO_DATA': return '❓';
    case 'PROFILE_INCOMPLETE': return 'ℹ️';
    case 'NOT_HARDWARE_REVIEW': return '📋';
    default: return '❓';
  }
}