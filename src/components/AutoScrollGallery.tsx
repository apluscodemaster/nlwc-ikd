"use client";

import useSWR from "swr";
import Image from "next/image";
import React from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AutoScrollGallery() {
  const { data, error, isLoading } = useSWR(
    "/api/autoscroll-gallery",
    fetcher,
    {
      refreshInterval: 1000 * 60 * 5,
    }
  );

  if (error)
    return (
      <div className="text-center py-10 text-red-600">
        Failed to load gallery
      </div>
    );
  if (isLoading)
    return (
      <div className="text-center py-10">Loading auto-scroll gallery...</div>
    );

  const images: string[] = data?.images || [];

  return (
    <section className="relative w-full overflow-hidden bg-gray-100 py-10">
      <h2 className="text-black text-5xl text-center my-4 font-bold ">
        Pastor Laide Olaniyan @40 - April 2025
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
