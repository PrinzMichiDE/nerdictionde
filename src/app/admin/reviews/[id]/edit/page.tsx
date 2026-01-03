import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReviewEditor } from "@/app/admin/components/ReviewEditor";

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

  return (
    <div className="flex flex-col h-full -mt-4">
       <ReviewEditor review={review as any} />
    </div>
  );
}

