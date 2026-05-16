"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimeLimitOverlayProps {
  questionCount: number;
  timeLimit: number; // in seconds
  onContinue: () => void;
}

export default function TimeLimitOverlay({
  questionCount,
  timeLimit,
  onContinue,
}: TimeLimitOverlayProps) {
  const minutes = Math.floor(timeLimit / 60);
  const seconds = timeLimit % 60;

  // Format time display
  const timeDisplay =
    minutes > 0
      ? `${minutes} minute${minutes !== 1 ? "s" : ""}`
      : `${seconds} seconds`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header with timer icon */}
        <div className="bg-linear-to-r from-blue-500 to-blue-600 px-6 sm:px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
          </div>

          <motion.div
            className="relative w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Clock className="w-8 h-8 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Ready to Start?
          </h2>
          <p className="text-blue-100 text-sm">
            Test your knowledge and earn points
          </p>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-8 py-8">
          {/* Quiz info */}
          <div className="mb-8 space-y-4">
            {/* Question count */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-blue-600">Q</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Questions
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {questionCount}
                </p>
              </div>
            </div>

            {/* Time limit */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  Time Limit
                </p>
                <p className="text-lg font-bold text-blue-900">{timeDisplay}</p>
              </div>
            </div>

            {/* Time per question info */}
            <div className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <p className="font-semibold text-amber-900 mb-1">
                ⏱️ Time Per Question
              </p>
              <p>
                You have approximately{" "}
                <span className="font-bold text-amber-900">60 seconds</span> per
                question. Answer strategically and move at your own pace!
              </p>
            </div>
          </div>

          {/* Important notes */}
          <div className="mb-8 text-xs text-gray-600 space-y-2">
            <p>
              ✓ Once you start, the timer will count down and you cannot pause
              it
            </p>
            <p>
              ✓ You can answer questions at your own pace within the time limit
            </p>
            <p>
              ✓ When time is up, your answers will be automatically submitted
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={onContinue}
            className="w-full h-12 rounded-full font-bold cursor-pointer"
          >
            Let&apos;s Begin <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
