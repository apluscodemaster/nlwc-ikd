"use client";

import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";
import { motion } from "framer-motion";

const contactDetails = [
  {
    icon: MapPin,
    title: "Our Location",
    content:
      "15, Alhaji Jimoh Olosugbo Close, Off Kokoro Abu Street, Grammar School Bus Stop, Off Obafemi Awolowo way, Ikorodu.",
    description: "Visit us for any of our weekly services.",
  },
  {
    icon: Phone,
    title: "Phone Number",
    content: "+234 703 576 0085",
    description: "Mon-Fri from 9am to 6pm.",
  },
  {
    icon: Mail,
    title: "Email Address",
    content: "ikoroduchurchadmin@nlwc.church",
    description: "We'll respond within 24 hours.",
  },
  {
    icon: Clock,
    title: "Office Hours",
    content: "Monday - Friday",
    description: "9:00 AM - 5:00 PM",
  },
];

const socials = [
  { icon: Facebook, href: "https://facebook.com/nlwclife", label: "Facebook" },
  { icon: Twitter, href: "https://x.com/nlwclife", label: "X (Twitter)" },
  {
    icon: Instagram,
    href: "https://www.instagram.com/nlwclife/",
    label: "Instagram",
  },
  {
    icon: Youtube,
    href: "https://www.youtube.com/@nlwclife",
    label: "Youtube",
  },
];

export function SocialConnect() {
  return (
    <div className="p-5 xs:p-6 md:p-8 rounded-3xl bg-primary text-white shadow-xl shadow-primary/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-12">
        <div className="max-w-md">
          <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">
            Connect on Social Media
          </h3>
          <p className="text-sm md:text-base text-white/80 leading-relaxed">
            Follow us for daily inspirations, live updates, and community news
            across all our social platforms.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 sm:gap-3 md:gap-4 justify-start">
          {socials.map((social, index) => (
            <motion.a
              key={index}
              href={social.href}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 xs:w-11 xs:h-11 md:w-12 md:h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
              aria-label={social.label}
            >
              <social.icon className="w-5 h-5 md:w-6 md:h-6" />
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ContactInfo() {
  return (
    <div className="grid sm:grid-cols-2 gap-3.5 sm:gap-4 md:gap-8">
      {contactDetails.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="flex gap-3 md:gap-4 p-4 md:p-6 rounded-3xl bg-gray-50 border border-gray-100 h-full overflow-hidden"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm xs:text-base md:text-lg font-bold text-gray-900 mb-1">
              {item.title}
            </h3>
            <p className="text-primary font-semibold mb-1 text-xs xs:text-sm md:text-base break-words leading-snug">
              {item.content}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
