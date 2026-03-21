"use client";

import React from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import { meetings } from "@/data/meetings";
import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

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
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export default function MeetingsGrid() {
  return (
    <SectionContainer className="bg-gray-900 text-white">
      <div className="text-center mb-16 space-y-4">
        <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
          — OUR MEETINGS
        </h4>
        <h2 className="text-3xl md:text-5xl font-bold">
          Something for <span className="text-primary">Everyone</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          We believe in community and connection. Explore our various meetings
          and find where you belong.
        </p>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {meetings.map((meeting) => (
          <motion.div
            key={meeting.id}
            variants={cardVariants}
            whileHover={{ y: -10 }}
            className="group bg-white/5 border border-white/10 p-6 sm:p-10 rounded-3xl hover:bg-white/10 transition-all duration-300"
          >
            <div
              className={`w-16 h-16 ${meeting.color} rounded-2xl flex items-center justify-center mb-8 transform group-hover:rotate-6 transition-transform`}
            >
              <meeting.icon className={`w-8 h-8 ${meeting.iconColor}`} />
            </div>
            <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
              {meeting.name}
            </h3>
            <p className="text-gray-400 leading-relaxed mb-8">
              {meeting.description}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center text-primary font-bold hover:gap-2 transition-all"
            >
              Learn More <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </SectionContainer>
  );
}
