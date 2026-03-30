"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { Devotional } from "@/lib/devotionals";

interface FeaturedDevotionalProps {
  devotional: Devotional;
}

export default function FeaturedDevotional({
  devotional,
}: FeaturedDevotionalProps) {
  const formattedDate = devotional.scheduledDate
    .toDate()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-16"
    >
      <div className="group relative overflow-hidden rounded-[32px] border border-primary/20 bg-white shadow-2xl shadow-primary/5">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

        <div className="relative flex flex-col md:flex-row items-stretch">
          {/* Visual Side */}
          <div className="md:w-2/5 relative min-h-[250px] md:min-h-auto overflow-hidden bg-linear-to-br from-primary via-primary/90 to-amber-500">
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-24 h-24 text-white/20" />
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent md:bg-linear-to-r" />

            <div className="absolute bottom-6 left-6 md:top-8 md:left-8">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Latest Devotional
              </span>
            </div>
          </div>

          {/* Content Side */}
          <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4 text-primary font-semibold">
              <Calendar className="w-5 h-5" />
              <span className="text-sm md:text-base">{formattedDate}</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight group-hover:text-primary transition-colors duration-300">
              {devotional.title}
            </h2>

            <p className="text-gray-600 text-lg mb-8 line-clamp-2 md:line-clamp-none max-w-xl">
              Start your day with spiritual nourishment. Dive into today&apos;s
              word and be strengthened in your walk with God.
            </p>

            <div className="flex flex-wrap gap-4 mt-auto">
              <Link
                href={`/devotionals/${devotional.id}`}
                className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Read Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={devotional.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-gray-50 border border-gray-100 text-gray-700 font-bold text-lg hover:bg-gray-100 transition-all"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
