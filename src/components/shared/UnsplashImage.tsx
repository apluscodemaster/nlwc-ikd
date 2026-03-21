"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { UnsplashCategory, getUnsplashUrl } from "@/lib/unsplash";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface UnsplashImageProps {
  category: UnsplashCategory;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function UnsplashImage({
  category,
  alt,
  width = 1200,
  height = 800,
  className,
  priority = false,
}: UnsplashImageProps) {
  const [src, setSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate a consistent URL for this session
    setSrc(getUnsplashUrl(category, width, height));
  }, [category, width, height]);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
      {src && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={cn(
            "object-cover transition-all duration-500",
            isLoading ? "scale-110 blur-lg" : "scale-100 blur-0",
          )}
          onLoadingComplete={() => setIsLoading(false)}
        />
      )}
    </div>
  );
}
