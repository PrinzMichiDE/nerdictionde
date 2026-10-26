import { z } from 'zod';
import { REACTION_TYPES, type ReactionType } from '@/types/review-reactions';

export const reactionTypeSchema = z.enum(REACTION_TYPES as [ReactionType, ...ReactionType[]]);

export const toggleReactionRequestSchema = z.object({
  type: reactionTypeSchema,
});

export const reactionParamsSchema = z.object({
  id: z.string().cuid('Ungültige Review-ID'),
});

export const reactionQuerySchema = z.object({
  type: reactionTypeSchema.optional(),
});

export type ToggleReactionRequest = z.infer<typeof toggleReactionRequestSchema>;
export type ReactionParams = z.infer<typeof reactionParamsSchema>;
export type ReactionQuery = z.infer<typeof reactionQuerySchema>;