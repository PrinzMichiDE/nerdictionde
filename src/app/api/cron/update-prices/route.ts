import { NextRequest, NextResponse } from "next/server";
import { updatePriceHistoryForBatch } from "@/lib/price-monitoring";

/**
 * Cron: Update price history for reviews with Amazon ASIN.
 * Schedule: daily at 6:00 (0 6 * * *)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "30", 10), 50);

    const result = await updatePriceHistoryForBatch(limit);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    return NextResponse.json({
      success: true,
      message: `Price update completed: ${result.updated} new prices, ${result.processed} processed`,
      ...result,
      duration: parseFloat(duration),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error("Cron update-prices error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Price update failed", duration: parseFloat(duration) },
      { status: 500 }
    );
  }
}
