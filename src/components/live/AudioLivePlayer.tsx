"use client";

import React, { useState } from "react";
import { Radio, Activity, Maximize2, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const WAYSTREAM_EMBED_URL =
  process.env.NEXT_PUBLIC_WAYSTREAM_EMBED_URL ||
  "https://app.waystream.io/embed/nlwcikorodu?orientation=portrait";

export default function AudioLivePlayer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Decorative background Elements */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl animate-pulse" />

      <div className="relative bg-white rounded-[40px] shadow-2xl border border-gray-100 p-6 sm:p-8 md:p-12 overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Audio Visualizer / Status Indicator */}
          <div className="relative w-full md:w-64 shrink-0">
            <div className="relative aspect-square max-w-[256px] mx-auto">
              <div className="absolute inset-0 rounded-[32px] bg-linear-to-br from-primary to-orange-600 shadow-2xl animate-pulse" />

              <div className="absolute inset-0 flex items-center justify-center">
                <Radio className="w-20 h-20 sm:w-24 sm:h-24 text-white animate-pulse" />
              </div>

              {/* Pulsating circles */}
              <div className="absolute inset-0 rounded-[32px] border-2 border-white/30 animate-ping opacity-20" />
              <div className="absolute inset-0 rounded-[32px] border-2 border-white/20 animate-ping opacity-10 [animation-delay:0.5s]" />

              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  Live Now
                </span>
              </div>
            </div>
          </div>

          {/* Info + Controls */}
          <div className="flex-1 w-full space-y-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-primary">
                <Activity className="w-4 h-4 animate-bounce" />
                <span className="text-sm font-bold uppercase tracking-widest">
                  Audio Broadcast
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                NLWC Ikorodu Live Stream
              </h3>
              <p className="text-gray-500 font-medium">
                Listen to our services live via Waystream
              </p>
            </div>

            {/* Waveform Visualization */}
            <div className="h-12 flex items-center justify-center gap-1">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [8, Math.random() * 40 + 8, 8],
                  }}
                  transition={{
                    duration: 0.5 + Math.random(),
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-1.5 rounded-full bg-primary/40"
                />
              ))}
            </div>

            {/* Expand / Collapse toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 mx-auto md:mx-0 px-6 py-3 rounded-full bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  Collapse Player
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  Show Player
                </>
              )}
            </button>
          </div>
        </div>

        {/* Waystream Embed */}
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? "auto" : 0,
            opacity: isExpanded ? 1 : 0,
            marginTop: isExpanded ? 32 : 0,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "rounded-3xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50",
              isExpanded ? "block" : "hidden",
            )}
          >
            <iframe
              src={WAYSTREAM_EMBED_URL}
              title="NLWC Ikorodu Live Audio Broadcast"
              className="w-full border-none"
              style={{ minHeight: "500px" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
