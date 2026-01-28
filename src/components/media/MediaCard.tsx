"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Headset, Download, Monitor } from "lucide-react";
import type { Sermon } from "@/data/sermons";

interface MediaCardProps {
  media: Sermon;
}

export default function MediaCard({ media }: MediaCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer"
    >
      <div className="relative aspect-video rounded-3xl overflow-hidden mb-4 shadow-md group-hover:shadow-2xl transition-all duration-500">
        <Image
          src={media.thumbnail}
          alt={media.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

        {/* Type Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-widest shadow-lg">
          {media.type === "video" ? (
            <Monitor className="w-3 h-3" />
          ) : (
            <Headset className="w-3 h-3" />
          )}
          {media.type}
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transform scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
            {media.type === "video" ? (
              <Play className="w-6 h-6 text-primary fill-primary ml-1" />
            ) : (
              <Headset className="w-6 h-6 text-primary" />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-primary uppercase tracking-widest">
            {media.date}
          </p>
          {media.type === "audio" && (
            <button
              className="text-muted-foreground hover:text-primary transition-colors p-1"
              title="Download Audio"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
          {media.title}
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          {media.speaker}
        </p>
      </div>
    </motion.div>
  );
}
