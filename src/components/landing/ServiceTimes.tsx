"use client";

import React from "react";
import { MapPin, Clock } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { services } from "@/data/services";

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
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function ServiceTimes() {
  return (
    <section className="bg-gray-50 py-12 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={headingVariants}
          className="text-center mb-16 space-y-4"
        >
          <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
            — JOIN US THIS WEEK
          </h4>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            Weekly <span className="text-primary">Experience</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience worship, fellowship, and powerful teaching every week in
            a vibrant atmosphere of faith.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.id}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm hover:shadow-2xl transition-shadow duration-300 group border border-transparent hover:border-primary/10"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`w-20 h-20 ${service.color} rounded-2xl flex items-center justify-center mb-8`}
              >
                <service.icon className={`w-10 h-10 ${service.iconColor}`} />
              </motion.div>

              <h3 className="text-3xl font-bold mb-4 text-gray-900 group-hover:text-primary transition-colors">
                {service.name}
              </h3>

              <p className="text-muted-foreground mb-8 leading-relaxed">
                {service.description}
              </p>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-semibold">
                    {service.day} • {service.time}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <MapPin className="w-5 h-5" />
                  <span>{service.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
