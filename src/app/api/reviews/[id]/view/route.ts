import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { incrementViewCount } from "@/lib/db/statistics";

export const POST = apiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  
  await incrementViewCount(id);
  
  return successResponse({ success: true });
});
