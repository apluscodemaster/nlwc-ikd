"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { DateColumns } from "@/lib/sheets";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, ZoomIn } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { toGoogleImageURL } from "@/utils/driveImage";
import { motion, Variants } from "framer-motion";

const fetcher = async (): Promise<{ dates: DateColumns[] }> => {
  const res = await fetch("/api/sheet");
  if (!res.ok) {
    throw new Error("Failed to fetch gallery data");
  }
  return res.json();
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function GalleryPreview() {
  const { data, isLoading } = useQuery({
    queryKey: ["sheet-data"],
    queryFn: fetcher,
  });

  // Get the most recent 8 images
  const allImages = data?.dates.flatMap((d) => d.images) || [];
  const previewImages = allImages.slice(0, 8);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-32 overflow-hidden">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={headingVariants}
        className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
      >
        <div className="space-y-4 max-w-2xl">
          <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
            — OUR GALLERY
          </h4>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Our Worship <span className="text-primary">Experience</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Relive the beautiful memories from our services, special programs,
            and community events.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-full px-8 hidden md:flex"
        >
          <Link href="/gallery">
            View Full Gallery <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-3xl" />
          ))}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {previewImages.map((src, i) => (
            <motion.div
              key={i}
              variants={imageVariants}
              whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
              className="group relative aspect-square rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-500 cursor-pointer"
            >
              <Image
                src={toGoogleImageURL(src)}
                alt={`Church Memory ${i}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                unoptimized
              />
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.75 }}
                  whileHover={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ZoomIn className="text-white w-10 h-10" />
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
          {previewImages.length === 0 && (
            <motion.div
              variants={imageVariants}
              className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border border-dashed text-muted-foreground"
            >
              <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No photos uploaded yet.</p>
            </motion.div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-12 text-center md:hidden"
      >
        <Button asChild size="lg" className="rounded-full w-full">
          <Link href="/gallery">
            View Full Gallery <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}
