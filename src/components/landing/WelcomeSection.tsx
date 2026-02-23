"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Radio } from "lucide-react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { getUpcomingEvents } from "@/data/events";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

function useCountdown(targetDate: Date) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = Math.max(0, targetDate.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isLive: diff === 0 };
}

export default function WelcomeSection() {
  const nextEvent = useMemo(() => getUpcomingEvents()[0], []);
  const { days, hours, minutes, seconds, isLive } = useCountdown(
    nextEvent?.date ?? new Date(),
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-32 overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Image Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="space-y-4 pt-0 sm:pt-12">
            <motion.div
              variants={imageVariants}
              className="relative h-[200px] sm:h-[250px] rounded-3xl overflow-hidden shadow-xl transform hover:-rotate-2 transition-transform"
            >
              <Image
                src="/community.webp"
                alt="Community 1"
                fill
                className="object-cover"
              />
            </motion.div>
            <motion.div
              variants={imageVariants}
              className="relative h-[200px] sm:h-[250px] rounded-3xl overflow-hidden shadow-xl transform hover:rotate-2 transition-transform"
            >
              <Image
                src="/community2.webp"
                alt="Community 2"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
          <motion.div
            variants={imageVariants}
            className="relative h-[350px] sm:h-[550px] rounded-3xl overflow-hidden shadow-2xl"
          >
            <Image
              src="/community3.avif"
              alt="Church Pastor"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-sm font-medium uppercase tracking-widest text-primary mb-1">
                Our Leadership
              </p>
              <h3 className="text-xl font-bold">Welcome Home</h3>
            </div>
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
              — WHO WE ARE
            </h4>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
              A Place Encountering <br className="hidden sm:block" />{" "}
              <span className="text-primary">God&apos;s Love</span>
            </h2>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              At The New & Living Way Church, we believe in creating a space
              where everyone can encounter God&apos;s love, grow in faith, and
              serve others with purpose.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you&apos;re exploring faith for the first time or have
              been walking with Christ for years, you&apos;ll find a welcoming
              community here. We are more than just a church; we are a family.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-4">
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 h-14 text-md font-semibold"
            >
              <Link href="/about">
                Explore Our Story <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Next Service Countdown */}
          {nextEvent && (
            <motion.div
              variants={itemVariants}
              className="pt-8 border-t border-gray-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest">
                    {isLive ? "🔴 Happening Now" : "Next Up"}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">
                    {nextEvent.icon} {nextEvent.title}
                  </p>
                </div>

                {!isLive ? (
                  <div className="flex items-center gap-2">
                    {[
                      { value: days, label: "D" },
                      { value: hours, label: "H" },
                      { value: minutes, label: "M" },
                      { value: seconds, label: "S" },
                    ].map((unit) => (
                      <div
                        key={unit.label}
                        className="flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-gray-900 text-white"
                      >
                        <span className="text-lg sm:text-xl font-bold leading-none tabular-nums">
                          {unit.value.toString().padStart(2, "0")}
                        </span>
                        <span className="text-[9px] font-bold text-white/50 uppercase mt-0.5">
                          {unit.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                    <span className="text-sm font-bold text-red-600">LIVE</span>
                  </div>
                )}

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-full px-5 h-10 border-primary/30 text-primary hover:bg-primary hover:text-white font-bold transition-all"
                >
                  <Link href="/listen-live" className="flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    Join Live
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
