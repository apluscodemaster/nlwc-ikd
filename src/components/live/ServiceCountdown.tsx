"use client";

import React, { useState, useEffect } from "react";
import { Clock, Radio } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentHour = now.getHours();

      // Check if we're currently live (Sunday between 8:00 AM and 12:00 PM)
      if (dayOfWeek === 0 && currentHour >= 8 && currentHour < 12) {
        setIsLive(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setIsLive(false);

      // Calculate next Sunday at 8:00 AM
      const nextSunday = new Date();
      const daysUntilSunday = (7 - dayOfWeek) % 7;

      // If it's Sunday but after 12 PM, go to next Sunday
      if (dayOfWeek === 0 && currentHour >= 12) {
        nextSunday.setDate(now.getDate() + 7);
      } else if (daysUntilSunday === 0 && currentHour >= 8) {
        // It's Sunday but service not started yet handled above
        nextSunday.setDate(now.getDate() + 7);
      } else {
        nextSunday.setDate(now.getDate() + daysUntilSunday);
      }

      nextSunday.setHours(8, 0, 0, 0);

      // If Sunday 8am has passed today, move to next Sunday
      if (now > nextSunday) {
        nextSunday.setDate(nextSunday.getDate() + 7);
      }

      const difference = nextSunday.getTime() - now.getTime();

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
    <div className="flex flex-col items-center p-3 sm:p-4 min-w-[65px] sm:min-w-[80px] bg-white rounded-2xl shadow-sm border border-gray-100">
      <span className="text-2xl sm:text-3xl font-black text-primary">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
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
        className="flex flex-col items-center"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
          <div className="relative flex items-center gap-3 px-6 py-3 bg-red-500 rounded-full text-white">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="font-black uppercase tracking-widest text-sm">
              We&apos;re Live Now!
            </span>
          </div>
        </div>

        <p className="text-muted-foreground text-center mb-6 max-w-xs">
          Join thousands of believers worshipping together right now.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/live"
            className="h-12 px-8 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            Watch Video
          </Link>
          <Link
            href="/listen-live"
            className="h-12 px-8 rounded-full bg-white border border-gray-200 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
          >
            Listen Audio
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm mb-6">
        <Clock className="w-4 h-4 animate-pulse" />
        Next Service Starts In
      </div>
      <div className="flex gap-2 sm:gap-4">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Mins" />
        <TimeUnit value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  );
}
