"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function ServiceCountdown() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Logic for next Sunday at 8:00 AM
      const now = new Date();
      const nextSunday = new Date();
      nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7));
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
    <div className="flex flex-col items-center p-4 min-w-[80px] bg-white rounded-2xl shadow-sm border border-gray-100">
      <span className="text-3xl font-black text-primary">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm mb-6">
        <Clock className="w-4 h-4 animate-pulse" />
        Next Live Service Ends In
      </div>
      <div className="flex gap-4">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Mins" />
        <TimeUnit value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  );
}
