import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { verifySession } from "@/lib/auth-twitch";
import { getUserSeriesForEdit } from "@/lib/user-series";
import { featureFlags } from "@/lib/feature-flags";
import { NextRequest } from "next/server";
import EditUserSeriesPageClient from "./EditUserSeriesPageClient";

export default async function EditUserSeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!featureFlags.userSeries) {
    notFound();
  }

  const { slug } = await params;

  // Verify session using cookies from headers
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") || "";
  const mockRequest = new NextRequest("http://localhost", { headers: { cookie: cookieHeader } });
  const session = await verifySession(mockRequest);

  if (!session?.userId) {
    notFound();
  }

  const series = await getUserSeriesForEdit(slug, session.userId);

  if (!series) {
    notFound();
  }

  return <EditUserSeriesPageClient initialData={series} />;
}