"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, Target } from "lucide-react";

interface QuizProgressBarProps {
  correct: number;
  total: number;
  current: number;
}

export default function QuizProgressBar({
  correct,
  total,
  current,
}: QuizProgressBarProps) {
  const percentage = (correct / current) * 100 || 0;
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
          <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-1">
            Question
          </p>
          <p className="text-xl font-bold text-primary">{current}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3" /> Correct
          </p>
          <p className="text-xl font-bold text-emerald-600">{correct}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">
            Score
          </p>
          <p className="text-xl font-bold text-amber-600">
            {Math.round(percentage)}%
          </p>
        </div>
      </div>

      {/* Progress Bar - only show if total > 0 */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Quiz Progress
            </p>
            <p className="text-xs font-bold text-gray-600">
              {Math.round(progress)}%
            </p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-linear-to-r from-primary to-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
