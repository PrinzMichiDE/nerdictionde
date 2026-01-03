import { NextRequest } from "next/server";
import { apiHandler, validateBody } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { z } from "zod";

const AnalyticsEventSchema = z.object({
  type: z.enum(["pageview", "event"]),
  name: z.string(),
  properties: z.record(z.unknown()).optional(),
  timestamp: z.string().optional(),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await validateBody(AnalyticsEventSchema)(req);

  // In production, you would:
  // 1. Store in database
  // 2. Send to analytics service (Google Analytics, Plausible, etc.)
  // 3. Process for insights

  // For now, just log (in production, use proper logging service)
  if (process.env.NODE_ENV === "development") {
    console.log("Analytics Event:", body);
  }

  // Return success immediately (fire and forget)
  return successResponse({ success: true });
});
