"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

const fetcher = () =>
  fetch("/api/autoscroll-gallery").then((res) => res.json());

export default function AutoScrollGallery() {
  const { data, error, isLoading, isError } = useQuery({
    queryKey: ["autoscroll-gallery"],
    queryFn: fetcher,
    refetchInterval: 1000 * 60 * 5,
  });

  if (isError)
    return (
      <div className="text-center py-10 text-destructive font-medium">
        Failed to load gallery
      </div>
    );

  if (isLoading)
    return (
      <div className="w-full py-10 space-y-6 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <Skeleton className="h-12 w-3/4 mx-auto mb-8" />
        </div>
        <div className="flex gap-4 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className="h-[350px] w-[250px] rounded-xl flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );

  const images: string[] = data?.images || [];

  return (
    <section className="relative w-full overflow-hidden bg-gray-50/50 py-16">
      <h3 className="text-black text-3xl md:text-5xl text-center mb-12 font-bold px-4 max-w-4xl mx-auto leading-tight">
        Relive the <span className="text-primary">Beautiful Moments</span> From
        Season of The Spirit (SOTS&apos;26)
      </h3>

      <div className="relative group">
        {/* Gradient Masks for Premium Fade Effect */}
        <div className="absolute inset-y-0 left-0 w-20 md:w-40 bg-gradient-to-r from-gray-50/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 md:w-40 bg-gradient-to-l from-gray-50/80 to-transparent z-10 pointer-events-none" />

        {/* Top Row (scrolls left) */}
        <div className="flex gap-4 animate-scroll-left group-hover:[animation-play-state:paused]">
          {[...images, ...images].map((url, i) => (
            <div
              key={`top-${i}`}
              className="relative h-[280px] w-[200px] md:h-[350px] md:w-[250px] flex-shrink-0 overflow-hidden rounded-2xl shadow-sm transition-all duration-500 hover:shadow-xl hover:scale-105"
            >
              <Image
                src={url}
                alt={`Gallery image ${i}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 200px, 250px"
              />
            </div>
          ))}
        </div>

        {/* Bottom Row (scrolls right) */}
        <div className="flex gap-4 animate-scroll-right mt-6 group-hover:[animation-play-state:paused]">
          {[...images, ...images].map((url, i) => (
            <div
              key={`bottom-${i}`}
              className="relative h-[280px] w-[200px] md:h-[350px] md:w-[250px] flex-shrink-0 overflow-hidden rounded-2xl shadow-sm transition-all duration-500 hover:shadow-xl hover:scale-105"
            >
              <Image
                src={url}
                alt={`Gallery image ${i}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 200px, 250px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
