"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight - 100,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative w-full h-[600px] md:h-[800px] flex items-center justify-center overflow-hidden">
      {/* Background Image with CSS animation - removes need for framer-motion (~92KB savings) */}
      <div className="absolute inset-0 animate-in fade-in zoom-in duration-1500">
        <Image
          src="https://res.cloudinary.com/dj7rh8h6r/image/upload/f_auto,q_auto:eco,w_1920/v1774247833/nlwc-ikd-assets/ygkueoffnv3wvqy4d7ir.avif"
          alt="Congregation worshipping at NLWC Ikorodu during Sunday service"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1920px"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Hero Content - using CSS animations via Tailwind */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center text-white">
        <h1 className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 text-3xl xs:text-4xl md:text-7xl font-bold mb-4 md:mb-6 leading-tight">
          Welcome to{" "}
          <span className="text-primary">The New & Living Way Church</span>
        </h1>

        <p className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400 text-lg md:text-2xl mb-8 md:mb-10 text-gray-200 max-w-3xl mx-auto px-4">
          A community of faith, hope, and love in Ikorodu. Join us as we grow
          together in Christ.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600 flex flex-row gap-3 md:gap-4 justify-center items-center px-2">
          <Button
            asChild
            size="lg"
            className="text-sm md:text-lg px-4 xs:px-6 md:px-10 h-12 md:h-14 rounded-full shadow-2xl hover:scale-105 transition-transform shrink-0"
          >
            <Link href="/about">
              About Us
              <ArrowRight className="ml-1 md:ml-2 w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="text-sm md:text-lg px-4 xs:px-6 md:px-10 h-12 md:h-14 rounded-full shadow-2xl bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white hover:text-black transition-all shrink-0"
          >
            <Link href="/live">Watch Live</Link>
          </Button>
        </div>
      </div>

      {/* Scroll Indicator with CSS animation */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer group animate-in fade-in delay-1000 duration-700"
        aria-label="Scroll to content"
      >
        <span className="text-xs font-bold uppercase tracking-widest">
          Explore
        </span>
        <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center group-hover:border-white/60 transition-colors animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
    </section>
  );
}
