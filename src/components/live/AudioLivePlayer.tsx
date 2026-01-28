"use client";

import React, { useState } from "react";
import { Play, Pause, Volume2, Radio, Users, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AudioLivePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isLive, setIsLive] = useState(true); // Simulation

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Decorative background Elements */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl animate-pulse" />

      <div className="relative bg-white rounded-[40px] shadow-2xl border border-gray-100 p-8 md:p-12 overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Audio Visualizer / Album Art */}
          <div className="relative w-64 h-64 shrink-0">
            <div
              className={cn(
                "absolute inset-0 rounded-[32px] bg-gradient-to-br from-primary to-orange-600 shadow-2xl transition-transform duration-700",
                isPlaying ? "scale-105" : "scale-100",
              )}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <Radio
                className={cn(
                  "w-24 h-24 text-white transition-all duration-700",
                  isPlaying ? "animate-pulse scale-110" : "opacity-50",
                )}
              />
            </div>

            {/* Pulsating circles when playing */}
            {isPlaying && (
              <>
                <div className="absolute inset-0 rounded-[32px] border-2 border-white/30 animate-ping opacity-20" />
                <div className="absolute inset-0 rounded-[32px] border-2 border-white/20 animate-ping opacity-10 [animation-delay:0.5s]" />
              </>
            )}

            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                Live Now
              </span>
            </div>
          </div>

          {/* Controls & Info */}
          <div className="flex-1 w-full space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Activity className="w-4 h-4 animate-bounce" />
                <span className="text-sm font-bold uppercase tracking-widest">
                  Audio Broadcast
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 leading-tight">
                Sunday Morning Enlightenment Service
              </h3>
              <p className="text-gray-500 font-medium">
                Topic: Walking by the Spirit - Part 3
              </p>
            </div>

            {/* Waveform Visualization (Mock) */}
            <div className="h-12 flex items-center justify-center gap-1">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: isPlaying ? [8, Math.random() * 40 + 8, 8] : 8,
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

            <div className="flex items-center justify-between gap-6">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-110 transition-transform active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>

              <div className="flex-1 flex items-center gap-4">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <span className="text-xs font-bold text-gray-500 w-8">
                  {volume}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">
                  1.2k Listening
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-bold text-gray-600">
                  Stable Connection
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
