"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen h-[360px] md:h-[480px]">
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
            Joyful Worship Moments
          </h1>
        </div>
      </div>
    </section>
  );
}
