"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight - 100,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative w-full h-[600px] md:h-[800px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src="https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247833/nlwc-ikd-assets/ygkueoffnv3wvqy4d7ir.avif"
          alt="Church Worship Sanctuary"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center text-white">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-3xl xs:text-4xl md:text-7xl font-bold mb-4 md:mb-6 leading-tight"
        >
          Welcome to{" "}
          <span className="text-primary">The New & Living Way Church</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-2xl mb-8 md:mb-10 text-gray-200 max-w-3xl mx-auto px-4"
        >
          A community of faith, hope, and love in Ikorodu. Join us as we grow
          together in Christ.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-row gap-3 md:gap-4 justify-center items-center px-2"
        >
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
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer group"
        aria-label="Scroll to content"
      >
        <span className="text-xs font-bold uppercase tracking-widest">
          Explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center group-hover:border-white/60 transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>
    </section>
  );
}
