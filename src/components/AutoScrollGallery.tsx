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
    <section className="relative w-full overflow-hidden bg-gray-100 py-10">
      <h2 className="text-black text-5xl text-center my-4 font-bold ">
        Season Of The Spirit (SOTS&apos;26) Moments
      </h2>
      {/* Top Row (scrolls left) */}
      <div className="flex gap-4 animate-scroll-left">
        {[...images, ...images].map((url, i) => (
          <Image
            key={`top-${i}`}
            src={url}
            alt={`Gallery image ${i}`}
            width={250}
            height={300}
            className="object-cover rounded-lg shadow-md h-[350px] w-[250px] transition-transform duration-500"
          />
        ))}
      </div>

      {/* Bottom Row (scrolls right) */}
      <div className="flex gap-4 animate-scroll-right mt-6">
        {[...images, ...images].map((url, i) => (
          <Image
            key={`bottom-${i}`}
            src={url}
            alt={`Gallery image ${i}`}
            width={250}
            height={350}
            className="object-cover rounded-lg shadow-md h-[350px] w-[250px] transition-transform duration-500"
          />
        ))}
      </div>
    </section>
  );
}
