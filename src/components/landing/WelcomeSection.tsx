"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

export default function WelcomeSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Image Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-2 gap-4"
        >
          <div className="space-y-4 pt-12">
            <motion.div
              variants={imageVariants}
              className="relative h-[250px] rounded-3xl overflow-hidden shadow-xl transform hover:-rotate-2 transition-transform"
            >
              <Image
                src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1000&auto=format&fit=crop"
                alt="Community 1"
                fill
                className="object-cover"
              />
            </motion.div>
            <motion.div
              variants={imageVariants}
              className="relative h-[250px] rounded-3xl overflow-hidden shadow-xl transform hover:rotate-2 transition-transform"
            >
              <Image
                src="https://images.unsplash.com/photo-1511649475106-4ab986b6bc74?q=80&w=1000&auto=format&fit=crop"
                alt="Community 2"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
          <motion.div
            variants={imageVariants}
            className="relative h-[550px] rounded-3xl overflow-hidden shadow-2xl"
          >
            <Image
              src="https://images.unsplash.com/photo-1511649475106-4ab986b6bc74?q=80&w=1000&auto=format&fit=crop"
              alt="Church Pastor"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-sm font-medium uppercase tracking-widest text-primary mb-1">
                Our Leadership
              </p>
              <h3 className="text-xl font-bold">Welcome Home</h3>
            </div>
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
              — WHO WE ARE
            </h4>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              A Place Encountering <br />{" "}
              <span className="text-primary">God&apos;s Love</span>
            </h2>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              At The New & Living Way Church, we believe in creating a space
              where everyone can encounter God&apos;s love, grow in faith, and
              serve others with purpose.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you&apos;re exploring faith for the first time or have
              been walking with Christ for years, you&apos;ll find a welcoming
              community here. We are more than just a church; we are a family.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-4">
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 h-14 text-md font-semibold"
            >
              <Link href="/about">
                Explore Our Story <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-100"
          >
            <div>
              <p className="text-3xl font-bold text-primary">20+</p>
              <p className="text-sm text-muted-foreground font-medium uppercase">
                Years Active
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">10+</p>
              <p className="text-sm text-muted-foreground font-medium uppercase">
                Ministries
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground font-medium uppercase">
                Members
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
