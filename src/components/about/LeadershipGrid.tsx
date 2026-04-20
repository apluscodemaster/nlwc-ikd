"use client";

import React from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import SectionLabel from "@/components/shared/SectionLabel";
import { team } from "@/data/team";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LeadershipGrid() {
  return (
    <SectionContainer className="bg-gray-50">
      <div className="text-center mb-16 space-y-4">
        <SectionLabel>Our Leadership</SectionLabel>
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
          Meet Our <span className="text-primary">Pastors</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Dedicated leaders committed to serving our community and helping you
          grow in your spiritual journey.
        </p>
      </div>

      <div className="space-y-32 md:px-8 xl:px-24">
        {/* Lead Pastors Section */}
        {team
          .filter((member) => member.role.includes("Lead Pastor"))
          .map((member) => (
            <motion.div
              key={member.id}
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              {/* Image Column */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl group hover:shadow-2xl transition-all duration-500 w-full bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-auto max-h-[600px] object-contain group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Text Column */}
              <div className="space-y-6 text-left">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 border-b border-gray-200 pb-4 inline-block">
                  Meet Our Lead Pastors
                </h3>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  {member.bio.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
                <div className="pt-6 mt-6 border-t border-gray-200">
                  <h4 className="text-xl md:text-2xl font-bold text-gray-900">
                    {member.name}
                  </h4>
                  <p className="text-primary font-medium text-lg mt-1">
                    {member.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

        {/* Resident Pastors Section */}
        {team
          .filter((member) => member.role.includes("Resident Pastor"))
          .map((member) => (
            <motion.div
              key={member.id}
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              {/* Image Column - Reversed for alternating layout */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl group hover:shadow-2xl transition-all duration-500 w-full bg-white lg:order-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-auto max-h-[600px] object-contain group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Text Column */}
              <div className="space-y-6 text-left lg:order-1">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 border-b border-gray-200 pb-4 inline-block">
                  Meet Our Resident Pastors
                </h3>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  {member.bio.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
                <div className="pt-6 mt-6 border-t border-gray-200">
                  <h4 className="text-xl md:text-2xl font-bold text-gray-900">
                    {member.name}
                  </h4>
                  <p className="text-primary font-medium text-lg mt-1">
                    {member.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </SectionContainer>
  );
}
