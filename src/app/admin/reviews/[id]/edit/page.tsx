import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReviewEditor } from "@/app/admin/components/ReviewEditor";
import { Review } from "@/types/review";

export const metadata = {
  title: "Review bearbeiten",
};

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review) notFound();

  return <ReviewEditor review={review as Review} />;
}
