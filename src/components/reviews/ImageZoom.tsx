"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function ImageZoom({ src, alt, className, priority = false }: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoom = () => {
    setIsZoomed(true);
    setZoomLevel(2);
    document.body.style.overflow = "hidden";
  };

  const handleClose = () => {
    setIsZoomed(false);
    setZoomLevel(1);
    document.body.style.overflow = "";
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  return (
    <>
      <div className="relative group cursor-zoom-in" onClick={handleZoom}>
        <Image
          src={src}
          alt={alt}
          fill
          className={cn("object-cover transition-transform duration-300", className)}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="size-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ scale: zoomLevel }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full h-full"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-contain"
                  priority
                  sizes="100vw"
                />
              </motion.div>

              {/* Controls */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="bg-black/50 hover:bg-black/70 text-white border border-white/20"
                  aria-label="Rauszoomen"
                >
                  <ZoomOut className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  className="bg-black/50 hover:bg-black/70 text-white border border-white/20"
                  aria-label="Reinzoomen"
                >
                  <ZoomIn className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="bg-black/50 hover:bg-black/70 text-white border border-white/20"
                  aria-label="Schließen"
                >
                  <X className="size-5" />
                </Button>
              </div>

              {/* Zoom Level Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium border border-white/20">
                {Math.round(zoomLevel * 100)}%
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
