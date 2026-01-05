import { PCBuildDetail } from "@/components/gaming-pcs/PCBuildDetail";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";

async function getPCBuild(price: string) {
  const pricePoint = parseInt(price);
  const where: any = isNaN(pricePoint) 
    ? { slug: price } 
    : { pricePoint };

  where.status = "published";

  return await prisma.pCBuild.findFirst({
    where,
    include: {
      components: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
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

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
      <PCBuildDetail build={build as any} />
    </div>
  );
}

