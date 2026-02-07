"use client";

import React from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import { team } from "@/data/team";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
        <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
          — OUR LEADERSHIP
        </h4>
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
          Meet Our <span className="text-primary">Pastors</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Dedicated leaders committed to serving our community and helping you
          grow in your spiritual journey.
        </p>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {team.map((member) => (
          <Dialog key={member.id}>
            <DialogTrigger asChild>
              <motion.div
                variants={itemVariants}
                className="group cursor-pointer space-y-4"
              >
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <span className="text-white font-semibold">Read Bio</span>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium">{member.role}</p>
                </div>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
              <DialogHeader className="p-6 pb-2 border-b border-gray-50">
                <DialogTitle className="text-2xl font-bold">
                  About {member.name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {member.name}
                      </h4>
                      <p className="text-primary font-medium">{member.role}</p>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </motion.div>
    </SectionContainer>
  );
}
