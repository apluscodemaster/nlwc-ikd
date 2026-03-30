"use client";

import React from "react";
import { motion } from "framer-motion";

export default function MapEmbed() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="w-full h-[300px] md:h-full min-h-[300px] md:min-h-[400px] rounded-3xl overflow-hidden shadow-lg border border-gray-100"
    >
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.2122742948786!2d3.514591910572446!3d6.620531793346017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bee92e46e88f3%3A0x91120ab439eb6fa!2s(NLWC)%20New%20and%20Living%20Way%20Church%2C%20Ikorodu!5e0!3m2!1sen!2sng!4v1769590581121!5m2!1sen!2sng"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Church Location Map"
      ></iframe>
    </motion.div>
  );
}
