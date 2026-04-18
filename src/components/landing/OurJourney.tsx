"use client";

import React from "react";
import SectionLabel from "@/components/shared/SectionLabel";
import { motion, Variants } from "framer-motion";
import { Cross, Heart, Anchor } from "lucide-react";

const pillars = [
  {
    title: "Faith",
    icon: Cross,
    verse:
      "An unrelenting desire to live daily by the Faith of the Son of God, who loved us, and gave Himself for us.",
    reference: "Galatians 2:20",
    color: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    title: "Hope",
    icon: Anchor,
    verse:
      "We seek the hope of Eternal life, which God, that cannot lie, promised before the world began.",
    reference: "Titus 1:2",
    color: "from-amber-500/20 to-amber-500/5",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
  {
    title: "Charity",
    icon: Heart,
    verse:
      "And above all these things put on charity, which is the bond of perfectness.",
    reference: "Colossians 3:14",
    color: "from-rose-500/20 to-rose-500/5",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function OurJourney() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-32 overflow-hidden">
      {/* Heading */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={headingVariants}
        className="text-center mb-16 sm:mb-20 space-y-4"
      >
        <SectionLabel>Our Journey</SectionLabel>
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
          Faith · Hope · <span className="text-primary">Charity</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The pillars that guide our walk with Christ and define who we are as a
          church family.
        </p>
      </motion.div>

      {/* Pillar Cards */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
        className="grid md:grid-cols-3 gap-6 sm:gap-8"
      >
        {pillars.map((pillar) => (
          <motion.div
            key={pillar.title}
            variants={cardVariants}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="group relative rounded-3xl border border-gray-100 bg-white p-8 sm:p-10 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            {/* Gradient background on hover */}
            <div
              className={`absolute inset-0 bg-linear-to-br ${pillar.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`w-16 h-16 ${pillar.iconBg} rounded-2xl flex items-center justify-center mb-6`}
              >
                <pillar.icon className={`w-8 h-8 ${pillar.iconColor}`} />
              </motion.div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors">
                {pillar.title}
              </h3>

              {/* Verse */}
              <p className="text-muted-foreground leading-relaxed mb-4 italic">
                &ldquo;{pillar.verse}&rdquo;
              </p>

              {/* Reference */}
              <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider">
                {pillar.reference}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom CTA line */}
      {/* <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-center mt-12 sm:mt-16 text-lg sm:text-xl text-muted-foreground font-medium"
      >
        Fellowship with us at our meetings!
      </motion.p> */}
    </section>
  );
}
