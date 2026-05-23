"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-orange-50 to-amber-50 border border-amber-200"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Flame className="w-4 h-4 text-orange-500" />
      </motion.div>
      <span className="text-xs font-bold text-amber-800">
        {streak}-day streak: reviewed explanations on passed questions
      </span>
    </motion.div>
  );
}
