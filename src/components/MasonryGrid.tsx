// components/MasonryGrid.tsx
"use client";
import React from "react";
import GalleryImage from "./GalleryImage";

type Props = {
  images: string[];
};

/**
 * Using CSS columns for masonry. Images are inline-block width:100%, so they flow into columns.
 * Tailwind classes for responsive column counts.
 */
export default function MasonryGrid({ images }: Props) {
  return (
    <div className="w-full">
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-gap:1rem]">
        {images.map((src, i) => (
          <div key={i} className="inline-block w-full mb-4 break-inside-avoid">
            <GalleryImage src={src} alt={`img-${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
