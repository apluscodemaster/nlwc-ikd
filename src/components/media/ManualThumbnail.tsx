"use client";

import React from "react";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { manualBackgroundFor } from "@/utils/manualThumbnail";

interface ManualThumbnailProps {
  title: string;
  className?: string;
}

export default function ManualThumbnail({
  title,
  className = "",
}: ManualThumbnailProps) {
  const bgImage = manualBackgroundFor(title);

  return (
    <div className={`relative aspect-video overflow-hidden ${className}`}>
      {/* Background image */}
      <Image
        src={bgImage}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-black/30" />

      {/* Icon */}
      <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center z-10">
        <BookOpen className="w-4 h-4 text-white/80" />
      </div>

      {/* "Sunday School" label */}
      <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/50 bg-white/10 backdrop-blur-sm px-2 py-1 rounded z-10">
        Sunday School Manuals
      </span>

      {/* Full title text */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <p className="text-white font-bold text-sm sm:text-base leading-snug drop-shadow-lg">
          {title}
        </p>
      </div>
    </div>
  );
}
