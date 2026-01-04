"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Review } from "@/types/review";

interface ImageGalleryProps {
  reviews: Review[];
}

export function ImageGallery({ reviews }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; index: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Collect all images from reviews
  const allImages = reviews
    .flatMap((review) =>
      review.images?.map((img, idx) => ({
        src: img,
        title: review.title,
        reviewSlug: review.slug,
        id: `${review.id}-${idx}`,
      })) || []
    )
    .filter((img) => img.src);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (galleryRef.current) {
      observer.observe(galleryRef.current);
    }

    return () => {
      if (galleryRef.current) {
        observer.unobserve(galleryRef.current);
      }
    };
  }, []);

  const openLightbox = (src: string, title: string, index: number) => {
    setSelectedImage({ src, title, index });
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = "unset";
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (!selectedImage) return;
    const newIndex =
      direction === "next"
        ? (selectedImage.index + 1) % allImages.length
        : (selectedImage.index - 1 + allImages.length) % allImages.length;
    const newImage = allImages[newIndex];
    setSelectedImage({ src: newImage.src, title: newImage.title, index: newIndex });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateImage("prev");
      if (e.key === "ArrowRight") navigateImage("next");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  if (allImages.length === 0) {
    return null;
  }

  return (
    <>
      <section ref={galleryRef} className="space-y-8 py-16">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-2">
            <ZoomIn className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Bildergalerie
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Unsere besten Screenshots & Fotos
          </h2>
          <p className="text-muted-foreground text-lg">
            Klicke auf ein Bild für die Vollansicht
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allImages.slice(0, 12).map((image, index) => (
            <Card
              key={image.id}
              className={`group relative overflow-hidden border-2 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 hover:border-primary/30 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 0.05}s` }}
              onClick={() => openLightbox(image.src, image.title, index)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={image.src}
                  alt={image.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <div className="p-3 rounded-full bg-background/90 backdrop-blur-sm border-2 border-primary/30">
                    <ZoomIn className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs font-medium line-clamp-1">{image.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {allImages.length > 12 && (
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              +{allImages.length - 12} weitere Bilder verfügbar
            </p>
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
          onClick={closeLightbox}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full mx-4">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background border-2"
              onClick={closeLightbox}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation Buttons */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background border-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage("prev");
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background border-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage("next");
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image */}
            <div
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-full max-h-[90vh] w-auto h-auto">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  width={1920}
                  height={1080}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  unoptimized
                  priority
                />
              </div>
            </div>

            {/* Image Info */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-primary/30">
              <p className="text-sm font-semibold text-center">{selectedImage.title}</p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {selectedImage.index + 1} / {allImages.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
