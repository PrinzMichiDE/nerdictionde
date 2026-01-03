import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { successResponse, ApiErrors } from "@/lib/api-response";
import { getLatestPrice, getPriceStats } from "@/lib/db/price-history";

export const GET = apiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const searchParams = req.nextUrl.searchParams;
  const includeStats = searchParams.get("stats") === "true";

  if (includeStats) {
    const stats = await getPriceStats(id);
    if (!stats) {
      return ApiErrors.notFound("No price history found");
    }
    return successResponse(stats);
  }

  const latestPrice = await getLatestPrice(id);
  if (!latestPrice) {
    return ApiErrors.notFound("No price data found");
  }

  return successResponse(latestPrice);
});
