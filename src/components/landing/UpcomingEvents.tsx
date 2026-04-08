"use client";

import React, { useMemo } from "react";
import {
  Calendar,
  MapPin,
  ArrowRight,
  Clock,
  CalendarPlus,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUpcomingEvents, generateGoogleCalendarUrl } from "@/data/events";
import type { ChurchEvent } from "@/data/events";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const blobVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.2, 0.3, 0.2],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

function formatEventDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getCountdownLabel(date: Date): string {
  const days = getDaysUntil(date);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Worship: {
    bg: "bg-orange-500/20",
    text: "text-orange-300",
    border: "border-orange-500/30",
  },
  Prayer: {
    bg: "bg-blue-500/20",
    text: "text-blue-300",
    border: "border-blue-500/30",
  },
  Study: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
  },
  Special: {
    bg: "bg-purple-500/20",
    text: "text-purple-300",
    border: "border-purple-500/30",
  },
  Conference: {
    bg: "bg-amber-500/20",
    text: "text-amber-300",
    border: "border-amber-500/30",
  },
  Youth: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-300",
    border: "border-cyan-500/30",
  },
};

function EventCard({ event }: { event: ChurchEvent }) {
  const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Worship;
  const daysUntil = getDaysUntil(event.date);
  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;
  const googleCalUrl = generateGoogleCalendarUrl(event);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        y: -8,
        borderColor: "rgba(255, 124, 24, 0.5)",
        transition: { duration: 0.3 },
      }}
      className={`group bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 hover:bg-white/10 transition-colors duration-300 flex flex-col ${
        isToday ? "ring-2 ring-primary/50 border-primary/30" : ""
      }`}
    >
      {/* Header Row */}
      <div className="flex justify-between items-start mb-5">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`${colors.bg} border ${colors.border} px-3 py-1 rounded-full`}
        >
          <span
            className={`text-[10px] font-bold ${colors.text} uppercase tracking-widest`}
          >
            {event.category}
          </span>
        </motion.div>

        {/* Countdown */}
        <div className="flex flex-col items-end">
          <span className="text-2xl mb-0.5">{event.icon}</span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isToday
                ? "text-primary animate-pulse"
                : isTomorrow
                  ? "text-amber-400"
                  : "text-white/50"
            }`}
          >
            {getCountdownLabel(event.date)}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {event.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-5 line-clamp-2 leading-relaxed flex-1">
        {event.description}
      </p>

      {/* Details */}
      <div className="space-y-2.5 mb-6">
        <div className="flex items-center gap-3 text-gray-400">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium">
            {formatEventDate(event.date)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium">{event.time}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium">{event.location}</span>
        </div>
      </div>

      {/* Recurrence Badge + Add to Calendar */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
          {event.recurrence}
        </span>
        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-primary/30 text-white/70 hover:text-white text-xs font-semibold transition-all active:scale-95"
          title="Add to Google Calendar"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Remind Me
        </a>
      </div>
    </motion.div>
  );
}

export default function UpcomingEvents() {
  const events = useMemo(() => getUpcomingEvents().slice(0, 6), []);

  return (
    <section className="bg-gray-900 py-12 sm:py-32 relative overflow-hidden">
      {/* Decorative blobs */}
      <motion.div
        variants={blobVariants}
        animate="animate"
        className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
      />
      <motion.div
        variants={blobVariants}
        animate="animate"
        style={{ animationDelay: "2s" }}
        className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={headingVariants}
          className="text-center mb-16 space-y-4"
        >
          <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
            — THIS WEEK &amp; BEYOND
          </h4>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Upcoming <span className="text-primary">Gatherings</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Stay connected to our community through weekly services, prayer
            meetings, and special programs throughout the year.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Button
            asChild
            variant="link"
            className="text-white hover:text-primary transition-colors text-lg"
          >
            <Link href="/contact" className="flex items-center gap-2">
              Visit Us This Sunday <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
