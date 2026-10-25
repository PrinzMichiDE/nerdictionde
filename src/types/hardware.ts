/**
 * Hardware Compatibility Types
 * Phase 1: User Hardware Profile + Compatibility Check on Reviews
 */

export interface HardwareProfile {
  cpu: string;
  gpu: string;
  ram: string;           // z. B. "32GB DDR4-3200"
  monitor?: string;      // z. B. "27\" 1440p 144Hz"
  psu?: string;          // z. B. "750W 80+ Gold"
  resolution?: string;   // z. B. "1440p" | "1080p" | "4K"
  refreshRate?: number;  // z. B. 144
}

export interface HardwareProfileInput {
  cpu: string;
  gpu: string;
  ram: string;
  monitor?: string;
  psu?: string;
  resolution?: string;
  refreshRate?: number;
  enabled?: boolean;
}

export const HARDWARE_PROFILE_SCHEMA_FIELDS = ['cpu', 'gpu', 'ram', 'monitor', 'psu', 'resolution', 'refreshRate'] as const;

export type HardwareProfileField = typeof HARDWARE_PROFILE_SCHEMA_FIELDS[number];

export const REQUIRED_HARDWARE_FIELDS: HardwareProfileField[] = ['cpu', 'gpu', 'ram'];

/**
 * Compatibility Check Result
 */
export type CompatibilityStatus =
  | 'COMPATIBLE'
  | 'BOTTLENECK_WARNING'
  | 'INCOMPATIBLE'
  | 'NO_DATA'
  | 'PROFILE_INCOMPLETE'
  | 'NOT_HARDWARE_REVIEW';

export interface FpsEstimate {
  resolution: string;     // "1080p" | "1440p" | "4K"
  preset: string;         // "Low" | "Medium" | "High" | "Ultra"
  min: number;
  avg: number;
  max: number;
}

export interface CompatibilityResult {
  status: CompatibilityStatus;
  badgeLabel: string;
  badgeDetails: string;
  fpsEstimates: FpsEstimate[];
  limitingComponent?: 'cpu' | 'gpu' | 'ram' | 'psu';
  recommendation?: string;
}

/**
 * API Request/Response Types
 */
export interface HardwareProfileApiResponse {
  success: boolean;
  profile: HardwareProfile | null;
  enabled: boolean;
  version: number;
}

export interface HardwareProfileUpdateRequest {
  cpu: string;
  gpu: string;
  ram: string;
  monitor?: string;
  psu?: string;
  resolution?: string;
  refreshRate?: number;
  enabled?: boolean;
}

export interface CompatibilityApiResponse {
  success: boolean;
  data: CompatibilityResult | null;
  error?: string;
}

/**
 * Hardware Database Types (Static Data)
 */
export interface CpuEntry {
  name: string;
  brand: 'intel' | 'amd';
  tier: 'entry' | 'mid' | 'high' | 'enthusiast';
  cores: number;
  threads: number;
  baseClock: number;
  boostClock: number;
  tdp: number;
  releaseYear: number;
  socket: string;
  benchmarkIndex: number; // Relative to baseline (i5-12400 = 100)
}

export interface GpuEntry {
  name: string;
  brand: 'nvidia' | 'amd' | 'intel';
  tier: 'entry' | 'mid' | 'high' | 'enthusiast';
  vram: number;
  vramType: 'GDDR6' | 'GDDR6X' | 'HBM2' | 'GDDR5';
  tdp: number;
  releaseYear: number;
  benchmarkIndex: number; // Relative to baseline (RTX 3070 = 100)
}

export interface HardwareTierFactors {
  cpu: Record<string, number>;   // tier -> bottleneck factor vs GPU tier
  gpu: Record<string, number>;   // tier -> performance index
}