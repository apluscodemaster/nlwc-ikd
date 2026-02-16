"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, MapPin } from "lucide-react";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const blobVariants: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.1, 0.15, 0.1],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function CTASection() {
  return (
    <section className="bg-primary py-12 sm:py-32 relative overflow-hidden">
      {/* Background patterns with animation */}
      <motion.div
        variants={blobVariants}
        animate="animate"
        className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"
      />
      <motion.div
        variants={blobVariants}
        animate="animate"
        style={{ animationDelay: "3s" }}
        className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center text-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={headingVariants}
        >
          <h2 className="text-3xl md:text-6xl font-bold mb-8 leading-tight">
            Ready to Take the <br className="hidden sm:block" />{" "}
            <span className="text-black/30">Next Step</span>?
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Whether you have questions, need prayer, or want to join a ministry,
            we&apos;re here for you. Find your place in our church family.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants}>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="w-full h-20 rounded-2xl bg-white text-primary hover:bg-gray-100 shadow-xl group"
            >
              <Link
                href="/contact"
                className="flex flex-col items-center justify-center gap-1"
              >
                <MessageSquare className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-bold">Get In Touch</span>
              </Link>
            </Button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="w-full h-20 rounded-2xl bg-white text-primary hover:bg-gray-100 shadow-xl group"
            >
              <Link
                href="/give"
                className="flex flex-col items-center justify-center gap-1"
              >
                <Heart className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-bold">Give Online</span>
              </Link>
            </Button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="w-full h-20 rounded-2xl bg-white text-primary hover:bg-gray-100 shadow-xl group"
            >
              <Link
                href="/contact"
                className="flex flex-col items-center justify-center gap-1"
              >
                <MapPin className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-bold">Visit Us</span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 flex flex-wrap justify-center gap-8 text-white/70"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-white"
            />
            <span className="font-medium">Sunday @ 8:00 AM</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="w-2 h-2 rounded-full bg-white"
            />
            <span className="font-medium">Ikorodu, Lagos</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
