'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VehicleCategory, VEHICLE_GALLERY_IMAGES } from '@barcelona/shared';

interface VehicleImageCarouselProps {
  category: VehicleCategory;
  alt: string;
  className?: string;
  heightClass?: string;
}

export default function VehicleImageCarousel({
  category,
  alt,
  className = '',
  heightClass = 'h-52',
}: VehicleImageCarouselProps) {
  const images = VEHICLE_GALLERY_IMAGES[category] || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 40) {
      // Swiped left -> show next image
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    } else if (diff < -40) {
      // Swiped right -> show prev image
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
    setTouchStartX(null);
  };

  return (
    <div
      className={`relative w-full ${heightClass} overflow-hidden group/carousel select-none ${className}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Image
        key={images[currentIndex]}
        src={images[currentIndex]}
        alt={`${alt} (${currentIndex + 1}/${images.length})`}
        fill
        className="object-cover transition-all duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 50vw"
      />

      {/* Swipe arrows if more than 1 image */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-navy-950/70 hover:bg-gold-500 hover:text-navy-950 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-70 group-hover/carousel:opacity-100 transition-all z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-navy-950/70 hover:bg-gold-500 hover:text-navy-950 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-70 group-hover/carousel:opacity-100 transition-all z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 z-10 bg-navy-950/70 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'bg-gold-400 w-3' : 'bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
