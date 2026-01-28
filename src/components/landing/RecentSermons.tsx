"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Music, Monitor } from "lucide-react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { useSermons } from "@/hooks/useSermons";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function RecentSermons() {
  const { data: sermons, isLoading, isError } = useSermons();

  return (
    <section className="bg-white py-24 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={headingVariants}
          className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
        >
          <div className="space-y-4 max-w-2xl">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
              — RECENT MESSAGES
            </h4>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Spiritual <span className="text-primary">Nourishment</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Catch up on the latest messages and series from our pulpit.
              Available in video and audio formats.
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            size="lg"
            className="rounded-full px-8 text-primary hover:text-primary hover:bg-primary/5"
          >
            <Link href="/media">
              View All Messages <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video rounded-3xl" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-muted-foreground">
            Failed to load recent sermons.
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-8"
          >
            {sermons?.slice(0, 3).map((sermon) => (
              <motion.div
                key={sermon.id}
                variants={cardVariants}
                whileHover={{ y: -5, transition: { duration: 0.3 } }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 shadow-md group-hover:shadow-2xl transition-all duration-500">
                  <Image
                    src={sermon.thumbnail}
                    alt={sermon.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-6 h-6 text-primary fill-primary ml-1" />
                    </div>
                  </motion.div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary flex items-center gap-2">
                    {sermon.type === "video" ? (
                      <Monitor className="w-3 h-3" />
                    ) : (
                      <Music className="w-3 h-3" />
                    )}
                    {sermon.type.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-primary uppercase tracking-wider">
                    {sermon.date}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                    {sermon.title}
                  </h3>
                  <p className="text-muted-foreground font-medium">
                    {sermon.speaker}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
