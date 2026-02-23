"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full h-[360px] md:h-[380px]">
      <Image
        src="/gallery-bg.avif"
        alt="hero background"
        fill
        className="object-cover"
        priority
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="text-center w-full text-white">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold">
            Our Worship Experience
          </h1>
        </div>
      </div>
    </section>
  );
}
