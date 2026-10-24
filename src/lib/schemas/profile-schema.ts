import { z } from "zod";

export const updateProfileSchema = z.object({
  bio: z.string().max(500).optional().nullable(),
  isPublic: z.boolean().optional(),
  showRatings: z.boolean().optional(),
  showBookmarks: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;