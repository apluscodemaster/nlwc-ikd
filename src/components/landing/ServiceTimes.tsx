"use client";

import React, { useRef } from "react";
import { MapPin, Clock, ChevronLeft, ChevronRight, LucideIcon } from "lucide-react";
import { m as motion, Variants } from "framer-motion";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  annualMeetings,
  formatServiceHour,
  serviceDayLabel,
  serviceVisual,
} from "@/data/services";
import type { RecurringService } from "@/lib/scheduleService";

/** One card in the carousel: a weekly service (admin schedule) or an annual meeting. */
interface GatheringCard {
  id: string;
  name: string;
  /** Badge on the image, e.g. "Every Sunday" / "Annual". */
  badge: string;
  description: string;
  timeLabel: string;
  timeValue: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  image?: string;
}

async function fetchWeeklyServices(): Promise<RecurringService[]> {
  const res = await fetch("/api/schedule");
  if (!res.ok) throw new Error(`Schedule request failed (${res.status})`);
  const data = (await res.json()) as { recurring?: RecurringService[] };
  return (data.recurring ?? [])
    .filter((s) => s.active !== false)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startHour - b.startHour);
}

function weeklyCard(s: RecurringService): GatheringCard {
  const v = serviceVisual(s);
  return {
    id: s.id ?? `${s.dayOfWeek}-${s.startHour}`,
    name: s.label,
    badge: serviceDayLabel(s),
    description: s.description?.trim() || v.description,
    timeLabel: "Time",
    timeValue: formatServiceHour(s.startHour),
    icon: v.icon,
    color: v.color,
    iconColor: v.iconColor,
    // Admin images may be Cloudinary public IDs; only use full URLs here.
    image: s.imageUrl?.startsWith("http") ? s.imageUrl : v.image,
  };
}

const ANNUAL_CARDS: GatheringCard[] = annualMeetings.map((m) => ({
  id: m.id,
  name: m.name,
  badge: "Annual",
  description: m.description,
  timeLabel: "When",
  timeValue: m.period,
  icon: m.icon,
  color: m.color,
  iconColor: m.iconColor,
  image: m.image,
}));

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function ServiceTimes() {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Same source as the admin Schedule page and the live-service countdowns.
  const { data: weekly, isLoading } = useQuery({
    queryKey: ["schedule", "weekly"],
    queryFn: fetchWeeklyServices,
    staleTime: 5 * 60 * 1000,
  });
  const cards = [...(weekly ?? []).map(weeklyCard), ...ANNUAL_CARDS];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo =
        direction === "left"
          ? scrollLeft - scrollAmount
          : scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="bg-gray-50 py-16 sm:py-32 overflow-hidden">
      <div className="max-w-none mx-auto px-4 sm:px-10 lg:px-16 xl:px-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={headingVariants}
          className="text-center mb-16 space-y-4"
        >
          <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
            — JOIN OUR COMMUNITY
          </h4>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            Fellowship <span className="text-primary">Gatherings</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the warmth of community and the power of faith at our
            regular meetings.
          </p>
          <div className="flex items-center justify-center gap-2 text-primary font-semibold">
            <MapPin className="w-5 h-5" />
            <span>All meetings hold at the Church Auditorium, Ikorodu</span>
          </div>
        </motion.div>

        <div className="relative group/scroll max-w-7xl mx-auto">
          {/* Scroll Buttons */}
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 sm:-left-12 top-1/2 -translate-y-1/2 z-20 p-3 bg-white shadow-xl rounded-full text-gray-400 hover:text-primary hover:scale-110 transition-all opacity-0 group-hover/scroll:opacity-100 hidden sm:flex items-center justify-center border border-gray-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 sm:-right-12 top-1/2 -translate-y-1/2 z-20 p-3 bg-white shadow-xl rounded-full text-gray-400 hover:text-primary hover:scale-110 transition-all opacity-0 group-hover/scroll:opacity-100 hidden sm:flex items-center justify-center border border-gray-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Scrollable Container */}
          <motion.div
            ref={scrollRef}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="flex overflow-x-auto gap-6 scroll-smooth scrollbar-hide pb-12 px-2 -mx-2"
          >
            {isLoading &&
              [0, 1, 2].map((i) => (
                <div
                  key={`placeholder-${i}`}
                  aria-hidden="true"
                  className="min-w-[300px] sm:min-w-[380px] h-[460px] bg-white rounded-[2.5rem] border border-gray-100/50 animate-pulse"
                />
              ))}
            {cards.map((service) => (
              <motion.div
                key={service.id}
                variants={cardVariants}
                className="min-w-[300px] sm:min-w-[380px] bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group border border-gray-100/50 hover:border-primary/10 flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-64 overflow-hidden">
                  {service.image ? (
                    <motion.div
                      className="relative w-full h-full"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Image
                        src={service.image}
                        alt={service.name}
                        fill
                        className="object-cover transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 380px, 380px"
                      />
                    </motion.div>
                  ) : (
                    <div className={`w-full h-full ${service.color}`} />
                  )}

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                  {/* Icon Overlay */}
                  <div className="absolute top-6 left-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-12 h-12 ${service.color} rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md bg-opacity-90`}
                    >
                      <service.icon
                        className={`w-6 h-6 ${service.iconColor}`}
                      />
                    </motion.div>
                  </div>

                  {/* Badge */}
                  <div className="absolute bottom-6 left-6">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-gray-900 shadow-sm uppercase tracking-wider">
                      {service.badge}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 sm:p-10 flex flex-col grow bg-white">
                  <h3 className="text-2xl font-extrabold mb-4 text-gray-900 group-hover:text-primary transition-colors tracking-tight">
                    {service.name}
                  </h3>

                  <p className="text-muted-foreground mb-8 leading-relaxed line-clamp-2 text-[0.95rem]">
                    {service.description}
                  </p>

                  <div className="mt-auto pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            {service.timeLabel}
                          </span>
                          <span className="font-bold text-sm text-gray-900">
                            {service.timeValue}
                          </span>
                        </div>
                      </div>

                      <motion.div
                        whileHover={{ x: 5 }}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300 cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
