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
      <div className="text-center py-20 text-red-500 font-medium bg-red-50/30 rounded-[48px] mx-4 border border-red-100/50">
        We encountered an issue loading the collection archive.
      </div>
    );

  if (isLoading)
    return (
      <div className="w-full py-20 space-y-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Skeleton className="h-4 w-32 mx-auto mb-4" />
          <Skeleton className="h-12 w-3/4 mx-auto mb-12 rounded-2xl" />
        </div>
        <div className="flex gap-6 px-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton
              key={i}
              className="h-[300px] w-[220px] md:h-[400px] md:w-[300px] rounded-[32px] shrink-0"
            />
          ))}
        </div>
      </div>
    );

  const images: string[] = data?.images || [];

  return (
    <section className="relative w-full overflow-hidden bg-white py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 mb-16 md:mb-20 text-center space-y-4">
        <h4 className="text-primary font-black uppercase tracking-[0.3em] text-xs md:text-sm">
          — VIRTUAL ARCHIVE
        </h4>
        <h3 className="text-gray-900 text-3xl md:text-6xl font-black max-w-4xl mx-auto leading-[1.1]">
          Relive the <span className="text-primary italic">Soul-Stirring</span>{" "}
          Moments
        </h3>
        <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg font-medium">
          A continuous flow of memories captured during the Season of The Spirit
          &apos;26.
        </p>
      </div>

      <div className="relative group">
        {/* Superior Gradient Masks for Perfectly Seamless Fade */}
        <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-linear-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-linear-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div className="space-y-6 md:space-y-8">
          {/* Top Row (scrolls left) */}
          <div className="flex gap-4 md:gap-6 animate-scroll-left hover:pause transition-all duration-500">
            {[...images, ...images].map((url, i) => (
              <div
                key={`top-${i}`}
                className="relative h-[220px] w-[160px] md:h-[400px] md:w-[300px] shrink-0 overflow-hidden rounded-[24px] md:rounded-[40px] shadow-sm transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.03] group/item border border-gray-100/50"
              >
                <Image
                  src={url}
                  alt={`Collection preview ${i}`}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover/item:scale-110"
                  sizes="(max-width: 768px) 160px, 300px"
                />
                <div className="absolute inset-0 bg-black/5 group-hover/item:bg-black/0 transition-colors duration-500" />
              </div>
            ))}
          </div>

          {/* Bottom Row (scrolls right) */}
          <div className="flex gap-4 md:gap-6 animate-scroll-right hover:pause transition-all duration-500">
            {[...images, ...images].map((url, i) => (
              <div
                key={`bottom-${i}`}
                className="relative h-[220px] w-[160px] md:h-[400px] md:w-[300px] shrink-0 overflow-hidden rounded-[24px] md:rounded-[40px] shadow-sm transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.03] group/item border border-gray-100/50"
              >
                <Image
                  src={url}
                  alt={`Collection preview ${i}`}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover/item:scale-110"
                  sizes="(max-width: 768px) 160px, 300px"
                />
                <div className="absolute inset-0 bg-black/5 group-hover/item:bg-black/0 transition-colors duration-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
