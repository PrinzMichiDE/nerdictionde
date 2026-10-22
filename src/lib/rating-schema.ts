import { z } from "zod";

export const createRatingSchema = z.object({
  reviewId: z.string().min(1),
  score: z.number().int().min(0).max(10),
  text: z.string().max(1000).optional(),
});

export const createVoteSchema = z.object({
  targetType: z.enum(["thread", "comment", "review"]),
  targetId: z.string().min(1),
  value: z.enum(["-1", "1"]).transform(Number),
});

export const createBookmarkSchema = z.object({
  reviewId: z.string().min(1),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type CreateVoteInput = z.infer<typeof createVoteSchema>;
export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
