"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";

interface QuizTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
}

export default function QuizTimer({ totalSeconds, onTimeUp }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        // Trigger warning at 5 minutes remaining (300 seconds)
        if (newTime === 300) {
          setIsWarning(true);
        }
        // Critical warning at 1 minute remaining
        if (newTime <= 60) {
          setIsWarning(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / totalSeconds) * 100;

  // Determine color based on time remaining
  let bgColor = "bg-emerald-500";
  let textColor = "text-emerald-600";
  let borderColor = "border-emerald-200";

  if (timeLeft <= 60) {
    bgColor = "bg-red-500";
    textColor = "text-red-600";
    borderColor = "border-red-200";
  } else if (timeLeft <= 300) {
    bgColor = "bg-amber-500";
    textColor = "text-amber-600";
    borderColor = "border-amber-200";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${borderColor}`}
      style={{
        backgroundColor: isWarning ? `${bgColor}08` : "rgb(240, 249, 255)",
      }}
    >
      {/* Timer icon */}
      <div className="relative flex-shrink-0">
        <svg className="w-12 h-12" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle cx="60" cy="60" r="55" fill="none" stroke="#e5e7eb" strokeWidth="4" />

          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r="55"
            fill="none"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 55}`}
            strokeDashoffset={`${2 * Math.PI * 55 * (1 - percentage / 100)}`}
            className={bgColor}
            strokeLinecap="round"
            style={{ transformOrigin: "60px 60px", rotate: "-90deg" }}
          />

          {/* Center time */}
          <text
            x="60"
            y="65"
            textAnchor="middle"
            className="text-xs font-bold fill-gray-900"
            fontSize="18"
          >
            {minutes}:{seconds.toString().padStart(2, "0")}
          </text>
        </svg>

        {/* Warning icon */}
        {isWarning && timeLeft <= 60 && (
          <motion.div
            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <AlertTriangle className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>

      {/* Timer info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Time Remaining
        </p>
        <p className={`text-xl font-bold ${textColor}`}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>

        {/* Status message */}
        {timeLeft <= 60 && (
          <motion.p
            className="text-xs text-red-600 font-semibold mt-1"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ⚠️ Time is running out!
          </motion.p>
        )}
        {timeLeft <= 300 && timeLeft > 60 && (
          <p className="text-xs text-amber-600 font-semibold mt-1">
            ⏱️ Hurry up!
          </p>
        )}
      </div>
    </motion.div>
  );
}
