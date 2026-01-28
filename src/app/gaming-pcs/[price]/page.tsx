import { PCBuildDetail } from "@/components/gaming-pcs/PCBuildDetail";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getBuildPerformance } from "@/lib/benchmarks";

async function getPCBuild(price: string) {
  const pricePoint = parseInt(price);
  const where: any = isNaN(pricePoint) 
    ? { slug: price } 
    : { pricePoint };

  where.status = "published";

  const build = await prisma.pCBuild.findFirst({
    where,
    include: {
      components: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  // Fetch review images for components that have reviewId
  if (build?.components) {
    const reviewIds = build.components
      .filter(c => c.reviewId)
      .map(c => c.reviewId!)
      .filter(Boolean);

    if (reviewIds.length > 0) {
      const reviews = await prisma.review.findMany({
        where: {
          id: { in: reviewIds },
        },
        select: {
          id: true,
          images: true,
        },
      });

      // Map review images to components
      const reviewImageMap = new Map(reviews.map(r => [r.id, r.images]));
      
      build.components = build.components.map(component => {
        if (component.reviewId && !component.image) {
          const reviewImages = reviewImageMap.get(component.reviewId);
          if (reviewImages && reviewImages.length > 0) {
            return {
              ...component,
              image: reviewImages[0], // Use first image from review
            };
          }
        }
        return component;
      });
    }
  }

  return build;
}

export async function generateMetadata(
  { params }: { params: Promise<{ price: string }> }
): Promise<Metadata> {
  const { price } = await params;
  const build = await getPCBuild(price);

  if (!build) {
    return {
      title: "PC Build nicht gefunden",
    };
  }

  return {
    title: `${build.title} | Nerdiction`,
    description: build.description || `Detaillierte Konfiguration für den besten ${build.pricePoint}€ Gaming PC. Alle Komponenten und aktuelle Preise im Überblick.`,
  };
}

export default async function PCBuildPage({ params }: { params: Promise<{ price: string }> }) {
  const { price } = await params;
  const build = await getPCBuild(price);

  if (!build) {
    notFound();
  }

  // Fetch performance data (benchmarks and FPS)
  let performanceData = null;
  try {
    if (build.components && build.components.length > 0) {
      performanceData = await getBuildPerformance(build.components as any);
    }
  } catch (error) {
    console.error("Error fetching performance data:", error);
    // Continue without performance data if it fails
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
      <PCBuildDetail 
        build={build as any} 
        performanceData={performanceData}
      />
    </div>
  );
}

