"use client";

import React from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import { motion, Variants } from "framer-motion";
import Image from "next/image";

const textVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

export default function StorySection() {
  return (
    <SectionContainer>
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={textVariants}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
              — OUR STORY
            </h4>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
              Founded on <span className="text-primary">Faith</span>,{" "}
              <br className="hidden sm:block" />
              Built on <span className="text-primary">Love</span>
            </h2>
          </div>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              The New & Living Way Church was founded with a clear vision: to
              create a community where the love of God is not just preached, but
              experienced. From our humble beginnings to the vibrant community
              we are today, our focus has remained the same—people.
            </p>
            <p>
              We believe that every individual has a unique purpose and a divine
              destiny. Our mission is to provide the spiritual nourishment,
              guidance, and fellowship necessary for you to discover and fulfill
              that purpose.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pt-8 border-t border-gray-100">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Our Mission</h3>
              <p className="text-muted-foreground">
                To lead people into a growing relationship with Jesus Christ.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Our Vision</h3>
              <p className="text-muted-foreground">
                To be a community that displays God&apos;s love and transforms
                lives.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={imageVariants}
          className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl"
        >
          <Image
            src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1000&auto=format&fit=crop"
            alt="Church Community"
            fill
            className="object-cover"
          />
        </motion.div>
      </div>
    </SectionContainer>
  );
}
