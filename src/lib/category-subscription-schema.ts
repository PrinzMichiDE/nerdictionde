import { z } from 'zod';
import { ReviewCategory } from '@prisma/client';

// Request Schemas
export const subscribeCategorySchema = z.object({
  category: z.nativeEnum(ReviewCategory),
});

export const categoryParamSchema = z.object({
  category: z.nativeEnum(ReviewCategory),
});

// Response Schemas
export const subscribedCategoriesResponseSchema = z.object({
  categories: z.array(z.nativeEnum(ReviewCategory)),
});

export const subscribeResponseSchema = z.object({
  subscribed: z.boolean(),
  category: z.nativeEnum(ReviewCategory),
});

export const unsubscribeResponseSchema = z.object({
  unsubscribed: z.boolean(),
  category: z.nativeEnum(ReviewCategory),
});

// Types
export type SubscribeCategoryInput = z.infer<typeof subscribeCategorySchema>;
export type CategoryParam = z.infer<typeof categoryParamSchema>;
export type SubscribedCategoriesResponse = z.infer<typeof subscribedCategoriesResponseSchema>;
export type SubscribeResponse = z.infer<typeof subscribeResponseSchema>;
export type UnsubscribeResponse = z.infer<typeof unsubscribeResponseSchema>;