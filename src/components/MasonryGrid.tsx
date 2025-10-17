"use client";
import React from "react";
import GalleryImage from "./GalleryImage";

type Props = {
  images: string[];
};

// Simple shuffle function for blending
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Using CSS columns for masonry layout.
 * Images are inline-block width:100%, so they flow into columns.
 */
export default function MasonryGrid({ images }: Props) {
  const mixedImages = shuffleArray(images);

  return (
    <div className="w-full">
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-gap:1rem]">
        {mixedImages.map((src, i) => (
          <div key={i} className="inline-block w-full mb-4 break-inside-avoid">
            <GalleryImage src={src} alt={`img-${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
