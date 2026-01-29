"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { upcomingEvents } from "@/data/events";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

export default function UpcomingEvents() {
  return (
    <section className="bg-gray-900 py-12 sm:py-32 relative overflow-hidden">
      {/* Decorative blobs with animation */}
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
            — DON&apos;T MISS OUT
          </h4>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Upcoming <span className="text-primary">Events</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Stay plugged into our community activities and special programs
            throughout the year.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid lg:grid-cols-3 gap-8"
        >
          {upcomingEvents.map((event) => (
            <motion.div
              key={event.id}
              variants={cardVariants}
              whileHover={{
                y: -8,
                borderColor: "rgba(255, 124, 24, 0.5)",
                transition: { duration: 0.3 },
              }}
              className="group bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 hover:bg-white/10 transition-colors duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-primary/20 border border-primary/30 px-4 py-1 rounded-full"
                >
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">
                    {event.category}
                  </span>
                </motion.div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-black text-white">
                    {event.date.split(" ")[1]}
                  </span>
                  <span className="text-xs font-bold text-primary uppercase">
                    {event.date.split(" ")[0]}
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-6 group-hover:text-primary transition-colors h-16 line-clamp-2">
                {event.title}
              </h3>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-gray-400">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {event.date} • {event.time}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{event.location}</span>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl border-white/20 text-black hover:bg-white hover:text-black"
              >
                <Link href="/contact">Register Now</Link>
              </Button>
            </motion.div>
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
              See Full Calendar <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
