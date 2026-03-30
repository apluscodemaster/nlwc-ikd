"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Headphones, Flame } from "lucide-react";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

export default function GodWantsYou() {
  return (
    <section className="relative bg-gray-900 py-20 sm:py-32 overflow-hidden">
      {/* Decorative blobs */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={containerVariants}
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Left Column: God Wants You */}
          <div className="text-center lg:text-left">
            <motion.p
              variants={itemVariants}
              className="text-primary font-bold uppercase tracking-[0.25em] text-xs sm:text-sm mb-6"
            >
              — A Message For You
            </motion.p>

            <motion.h2
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-8 leading-[1.1]"
            >
              God <span className="text-primary">Wants</span> You
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-10"
            >
              He wants to be a major part of your life, that is why He is
              raising sons and daughters strengthened and revitalized by the
              truths found in His word and He longs to make you one of them.
            </motion.p>

            <motion.div variants={itemVariants}>
              <Button
                asChild
                size="lg"
                className="rounded-full px-10 h-14 text-lg font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all"
              >
                <Link href="/sermons" className="flex items-center gap-3">
                  <Headphones className="w-5 h-5" />
                  Find the Truth
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Right Column: Get Saved */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-8 sm:p-10 text-center lg:text-left"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-400 to-rose-500 rounded-t-3xl" />

            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-6 mx-auto lg:mx-0">
              <Flame className="w-8 h-8 text-primary" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Get <span className="text-primary">Saved</span> Today
            </h3>

            <p className="text-gray-300 leading-relaxed mb-4 text-lg">
              Get saved and receive the Holy Ghost baptism too!
            </p>

            <p className="text-gray-400 leading-relaxed mb-8">
              Receive Jesus into your heart and also get baptized in the Holy
              Ghost.
            </p>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8 h-12 border-white/20 text-white bg-white/5 hover:bg-primary hover:text-white hover:border-primary font-bold transition-all"
            >
              <Link href="/salvation" className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Learn More
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
