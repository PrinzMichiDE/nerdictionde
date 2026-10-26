import { z } from 'zod/v4';

/**
 * Zod Schemas für Review Collections / Kuratierte Listen
 * Validierung aller API-Inputs für Collections
 */

// ============================================
// Basis-Schemas
// ============================================

/** Slug-Validierung: nur lowercase, Zahlen, Bindestriche, 3-100 chars */
const slugSchema = z.string()
  .min(3, 'Slug muss mindestens 3 Zeichen haben')
  .max(100, 'Slug darf maximal 100 Zeichen haben')
  .regex(/^[a-z0-9-]+$/, 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten')
  .refine(s => !s.startsWith('-') && !s.endsWith('-'), 'Slug darf nicht mit Bindestrich beginnen oder enden');

/** Titel: 3-100 Zeichen, kein reiner Whitespace */
const titleSchema = z.string()
  .min(3, 'Titel muss mindestens 3 Zeichen haben')
  .max(100, 'Titel darf maximal 100 Zeichen haben')
  .trim()
  .refine(s => s.length > 0, 'Titel darf nicht leer sein');

/** Beschreibung: optional, max 2000 Zeichen */
const descriptionSchema = z.string()
  .max(2000, 'Beschreibung darf maximal 2000 Zeichen haben')
  .trim()
  .optional()
  .nullable()
  .transform(v => v === '' ? null : v);

/** CUID für Review IDs */
const reviewIdSchema = z.string().cuid('Ungültige Review-ID');

/** Position: nicht-negativer Integer */
const positionSchema = z.number().int().min(0, 'Position muss >= 0 sein');

/** Boolean für Sichtbarkeit */
const isPublicSchema = z.boolean().default(true);

// ============================================
// Request-Schemas
// ============================================

/** POST /api/listen - Liste erstellen */
export const createCollectionSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  isPublic: isPublicSchema.optional(),
  reviewIds: z.array(reviewIdSchema).max(100, 'Maximal 100 Reviews initial hinzufügbar').optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

/** PATCH /api/listen/[slug] - Metadaten aktualisieren */
export const updateCollectionSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema,
  isPublic: isPublicSchema.optional(),
}).refine(data => Object.keys(data).length > 0, 'Mindestens ein Feld muss angegeben werden');

export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

/** POST /api/listen/[slug]/items - Review zur Liste hinzufügen */
export const addItemSchema = z.object({
  reviewId: reviewIdSchema,
  position: positionSchema.optional(),
});

export type AddItemInput = z.infer<typeof addItemSchema>;

/** PATCH /api/listen/[slug]/reorder - Reihenfolge ändern */
export const reorderSchema = z.object({
  reviewIds: z.array(reviewIdSchema).min(1, 'Mindestens eine Review-ID erforderlich'),
});

export type ReorderInput = z.infer<typeof reorderSchema>;

// ============================================
// Query-Schemas (für GET)
// ============================================

/** GET /api/listen - Öffentliche Listen mit Filter/Sort/Pagination */
export const listCollectionsQuerySchema = z.object({
  q: z.string().max(200, 'Suchbegriff zu lang').optional(),
  sort: z.enum(['updated', 'created', 'itemCount', 'popular', 'popularity']).default('updated'),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  ownerId: z.string().cuid().optional(), // für /api/me/listen
});

export type ListCollectionsQuery = z.infer<typeof listCollectionsQuerySchema>;

/** GET /api/listen/[slug] - Listen-Detail mit Items Pagination */
export const getCollectionQuerySchema = z.object({
  cursor: z.number().int().min(0).optional(), // position cursor
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type GetCollectionQuery = z.infer<typeof getCollectionQuerySchema>;

// ============================================
// Response-Helper (für API-Returns)
// ============================================

/** Collection Item für Responses */
export const collectionItemResponseSchema = z.object({
  id: z.string().cuid(),
  collectionId: z.string().cuid(),
  reviewId: z.string().cuid(),
  position: z.number().int(),
  addedAt: z.string().datetime(),
  review: z.object({
    id: z.string().cuid(),
    title: z.string(),
    slug: z.string(),
    category: z.string(),
    score: z.number().int(),
    images: z.array(z.string()),
    releaseDate: z.string().datetime().nullable(),
  }).optional(),
});

/** Collection für List-Response (ohne Items) */
export const collectionListResponseSchema = z.object({
  id: z.string().cuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  itemCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  owner: z.object({
    id: z.string().cuid(),
    username: z.string(),
    displayName: z.string(),
    profileImageUrl: z.string().nullable(),
  }),
});

/** Collection für Detail-Response (mit Items) */
export const collectionDetailResponseSchema = collectionListResponseSchema.extend({
  items: z.array(collectionItemResponseSchema),
  nextCursor: z.number().int().nullable(),
});

/** Eigene Listen Response (für /api/me/listen) */
export const myCollectionsResponseSchema = z.object({
  collections: z.array(collectionListResponseSchema),
  nextCursor: z.string().cuid().nullable(),
});

/** Paginierte Listen-Übersicht Response */
export const collectionsListResponseSchema = z.object({
  collections: z.array(collectionListResponseSchema),
  nextCursor: z.string().cuid().nullable(),
});

// ============================================
// Validierungs-Helper
// ============================================

/**
 * Validiert und sanitisiert einen Titel zu einem Slug
 * Wird serverseitig bei Erstellung verwendet
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // nur alphanumerisch, Leerzeichen, Bindestriche
    .replace(/\s+/g, '-')         // Leerzeichen zu Bindestrichen
    .replace(/-+/g, '-')          // multiple Bindestriche zu einem
    .replace(/^-+|-+$/g, '')      // führende/endende Bindestriche entfernen
    .slice(0, 100);               // max 100 chars
}

/**
 * Prüft ob ein Reorder-Array valide ist:
 * - Enthält genau alle aktuellen Review-IDs der Liste
 * - Keine Duplikate
 * - Alle sind CUIDs
 */
export function validateReorderArray(
  currentReviewIds: string[],
  newReviewIds: string[]
): { valid: boolean; error?: string } {
  if (newReviewIds.length !== currentReviewIds.length) {
    return { valid: false, error: 'Reorder-Array muss alle aktuellen Review-IDs enthalten' };
  }

  const currentSet = new Set(currentReviewIds);
  const newSet = new Set(newReviewIds);

  if (newSet.size !== newReviewIds.length) {
    return { valid: false, error: 'Reorder-Array enthält Duplikate' };
  }

  for (const id of newReviewIds) {
    if (!currentSet.has(id)) {
      return { valid: false, error: `Review-ID ${id} nicht in aktueller Liste gefunden` };
    }
  }

  return { valid: true };
}