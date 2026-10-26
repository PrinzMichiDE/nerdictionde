import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { renderReviewPdfToBuffer, sanitizeFilename } from "@/components/reviews/ReviewPdfLayout";
import { getSiteUrl } from "@/lib/seo";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") === "en" ? "en" : "de";
  const isEn = lang === "en";

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
      },
    });

    if (!review || review.status !== "published") {
      return new NextResponse("Review not found", { status: 404 });
    }

    const siteUrl = getSiteUrl();
    const pdfBuffer = await renderReviewPdfToBuffer(review, isEn, siteUrl);

    const filename = `${sanitizeFilename(review.slug)}-review.pdf`;

    // Convert Buffer to Uint8Array for Blob
    const pdfBytes = new Uint8Array(pdfBuffer);
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new NextResponse("PDF generation failed", { status: 500 });
  }
}