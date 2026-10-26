/**
 * Zod Schemas for Hardware Compatibility Feature
 * Input validation for API routes and client forms
 */

import { z } from 'zod';

// ============================================================================
// Hardware Profile Schemas
// ============================================================================

export const hardwareProfileInputSchema = z.object({
  cpu: z.string().min(1, 'CPU ist erforderlich').max(100),
  gpu: z.string().min(1, 'GPU ist erforderlich').max(100),
  ram: z.string().min(1, 'RAM ist erforderlich').max(50).regex(/^\d+\s*GB/i, 'Format: "32GB DDR5-6000"'),
  monitor: z.string().max(100).optional(),
  psu: z.string().max(100).optional(),
  resolution: z.enum(['1080p', '1440p', '4K', '2160p', '8K']).optional(),
  refreshRate: z.number().int().positive().max(500).optional(),
  enabled: z.boolean().optional(),
});

export const hardwareProfileUpdateSchema = hardwareProfileInputSchema.partial();

export const hardwareProfileResponseSchema = z.object({
  success: z.boolean(),
  profile: z.object({
    cpu: z.string(),
    gpu: z.string(),
    ram: z.string(),
    monitor: z.string().nullable().optional(),
    psu: z.string().nullable().optional(),
    resolution: z.string().nullable().optional(),
    refreshRate: z.number().nullable().optional(),
  }).nullable(),
  enabled: z.boolean(),
  version: z.number().int().positive(),
});

// ============================================================================
// Compatibility Check Schemas
// ============================================================================

export const fpsEstimateSchema = z.object({
  resolution: z.string(),
  preset: z.string(),
  min: z.number().int().nonnegative(),
  avg: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
});

export const compatibilityResultSchema = z.object({
  status: z.enum([
    'COMPATIBLE',
    'BOTTLENECK_WARNING',
    'INCOMPATIBLE',
    'NO_DATA',
    'PROFILE_INCOMPLETE',
    'NOT_HARDWARE_REVIEW'
  ]),
  badgeLabel: z.string(),
  badgeDetails: z.string(),
  fpsEstimates: z.array(fpsEstimateSchema),
  limitingComponent: z.enum(['cpu', 'gpu', 'ram', 'psu']).optional(),
  recommendation: z.string().optional(),
});

export const compatibilityApiResponseSchema = z.object({
  success: z.boolean(),
  data: compatibilityResultSchema.nullable(),
  error: z.string().optional(),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type HardwareProfileInput = z.infer<typeof hardwareProfileInputSchema>;
export type HardwareProfileUpdate = z.infer<typeof hardwareProfileUpdateSchema>;
export type HardwareProfileResponse = z.infer<typeof hardwareProfileResponseSchema>;
export type FpsEstimate = z.infer<typeof fpsEstimateSchema>;
export type CompatibilityResult = z.infer<typeof compatibilityResultSchema>;
export type CompatibilityApiResponse = z.infer<typeof compatibilityApiResponseSchema>;