"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ImageGalleryProps {
  images: string[];
  title: string;
  startIndex?: number;
}

export function ImageGallery({ images, title, startIndex = 0 }: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length]);

  if (images.length === 0) return null;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <motion.button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setIsOpen(true);
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative aspect-video overflow-hidden rounded-lg border-2 border-border hover:border-primary/50 transition-all group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Bild ${index + 1} von ${images.length} öffnen: ${title}`}
          >
            <Image
              src={image}
              alt={`${title} - Screenshot ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading={index < 4 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </motion.button>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Bildergalerie"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 size-10 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
              aria-label="Galerie schließen"
            >
              <X className="size-5" />
            </Button>

            {/* Previous Button */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={prevImage}
                className="absolute left-4 z-10 size-12 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
                aria-label="Vorheriges Bild"
              >
                <ChevronLeft className="size-6" />
              </Button>
            )}

            {/* Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <Image
                  src={images[currentIndex]}
                  alt={`${title} - Screenshot ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                  sizes="100vw"
                />
              </motion.div>
            </AnimatePresence>

            {/* Next Button */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="absolute right-4 z-10 size-12 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
                aria-label="Nächstes Bild"
              >
                <ChevronRight className="size-6" />
              </Button>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium border border-white/20">
                {currentIndex + 1} / {images.length}
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
