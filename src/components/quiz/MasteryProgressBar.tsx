"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface MasteryProgressBarProps {
  masteryPercent: number;
}

export default function MasteryProgressBar({
  masteryPercent,
}: MasteryProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, masteryPercent));

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-200">
      <Zap className="w-4 h-4 text-violet-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">
            Mastery
          </p>
          <p className="text-xs font-bold text-violet-600">{clamped}%</p>
        </div>
        <div className="h-2 bg-violet-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-linear-to-r from-violet-500 to-purple-500 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
