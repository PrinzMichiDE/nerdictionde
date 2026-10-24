"use client";

import React, { useState } from "react";
import Image from "next/image";

interface ReviewCompareGalleryProps {
  images: string[];
  title: string;
}

export function ReviewCompareGallery({ images, title }: ReviewCompareGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Keine Screenshots verfügbar
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    document.body.style.overflow = "";
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedIndex === null) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") setSelectedIndex((i) => (i === null ? 0 : Math.max(0, i - 1)));
    if (e.key === "ArrowRight") setSelectedIndex((i) => (i === null ? images.length - 1 : Math.min(images.length - 1, i + 1)));
  };

  React.useEffect(() => {
    if (selectedIndex !== null) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedIndex]);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2" role="list" aria-label={`${title} Screenshots`}>
        {images.slice(0, 5).map((img, i) => (
          <figure
            key={i}
            className="flex-shrink-0 w-48 aspect-[16/9] rounded overflow-hidden cursor-zoom-in"
            role="listitem"
            onClick={() => openLightbox(i)}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openLightbox(i)}
            aria-label={`Screenshot ${i + 1} von ${images.length}`}
          >
            <Image
              src={img}
              alt={`${title} Screenshot ${i + 1}`}
              fill
              className="object-cover transition-transform hover:scale-105 duration-200"
              sizes="192px"
              unoptimized
            />
          </figure>
        ))}
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} Screenshot ${selectedIndex + 1} von ${images.length}`}
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            aria-label="Lightbox schließen"
          >
            <svg className="size-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            className="absolute left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white hidden md:block"
            onClick={(e) => { e.stopPropagation(); setSelectedIndex((i) => (i === null ? 0 : Math.max(0, i - 1))); }}
            aria-label="Vorheriges Bild"
            disabled={selectedIndex === 0}
          >
            <svg className="size-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={images[selectedIndex]}
              alt={`${title} Screenshot ${selectedIndex + 1}`}
              width={1280}
              height={720}
              className="object-contain"
              unoptimized
              priority
            />
          </div>

          <button
            className="absolute right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white hidden md:block"
            onClick={(e) => { e.stopPropagation(); setSelectedIndex((i) => (i === null ? images.length - 1 : Math.min(images.length - 1, i + 1))); }}
            aria-label="Nächstes Bild"
            disabled={selectedIndex === images.length - 1}
          >
            <svg className="size-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}