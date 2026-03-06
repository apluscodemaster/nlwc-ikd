"use client";

import React, { useState, useEffect } from "react";
import { Clock, Radio, Calendar } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  isCurrentlyLive,
  getNextService,
  type NextServiceInfo,
} from "@/lib/liveSchedule";

interface TimeLeftState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function ServiceCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeftState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLive, setIsLive] = useState(false);
  const [nextService, setNextService] = useState<NextServiceInfo | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // Check if currently in a live service window
      if (isCurrentlyLive(now)) {
        setIsLive(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setNextService(null);
        return;
      }

      setIsLive(false);

      // Calculate countdown to the next service
      const next = getNextService(now);
      setNextService(next);

      const difference = next.date.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center p-2 xs:p-2.5 sm:p-4 min-w-[54px] xs:min-w-[65px] sm:min-w-[80px] bg-white rounded-2xl shadow-sm border border-gray-100">
      <span className="text-lg xs:text-2xl sm:text-3xl font-black text-primary">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[7px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5 xs:mt-1">
        {label}
      </span>
    </div>
  );

  // Live Now State
  if (isLive) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center w-full"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
          <div className="relative flex items-center gap-3 px-6 py-3 bg-red-500 rounded-full text-white">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="font-black uppercase tracking-widest text-xs sm:text-sm">
              We&apos;re Live Now!
            </span>
          </div>
        </div>

        <p className="text-muted-foreground text-center mb-6 max-w-xs text-sm sm:text-base">
          Join thousands of believers worshipping together right now.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
          <Link
            href="/live"
            className="h-12 px-8 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform w-full sm:w-auto transition-all"
          >
            Watch Video
          </Link>
          <Link
            href="/listen-live"
            className="h-12 px-8 rounded-full bg-white border border-gray-200 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all w-full sm:w-auto"
          >
            Listen Audio
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs sm:text-sm mb-4 text-center">
        <Clock className="w-4 h-4 animate-pulse shrink-0" />
        Next Service Starts In
      </div>

      {/* Service name + date badge */}
      {nextService && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mb-6 px-4 py-2.5 rounded-2xl sm:rounded-full bg-primary/5 border border-primary/10 max-w-full">
          <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-gray-800">
            {nextService.label}
          </span>
          <span className="hidden xs:inline text-sm text-gray-400">—</span>
          <span className="text-xs sm:text-sm font-semibold text-primary">
            {nextService.formattedDate}
          </span>
        </div>
      )}

      <div className="flex gap-1.5 xs:gap-2 sm:gap-4 w-full justify-center">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Mins" />
        <TimeUnit value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  );
}
