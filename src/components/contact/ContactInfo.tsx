"use client";

import React from "react";
import {
  Mail,
  Phone,
  MapPin,
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
  },
  {
    icon: Phone,
    title: "Phone Number",
    content: "+234 703 576 0085",
  },
  {
    icon: Mail,
    title: "Email Address",
    content: "ikoroduchurchadmin@nlwc.church",
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
    <div className="flex flex-col gap-4">
      {contactDetails.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="group relative flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
        >
          {/* Icon Container */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <item.icon className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 opacity-70">
              {item.title}
            </h3>
            
            {item.title === "Phone Number" ? (
              <a 
                href={`tel:${item.content.replace(/\s/g, '')}`}
                className="block text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary transition-colors wrap-break-word"
              >
                {item.content}
              </a>
            ) : item.title === "Email Address" ? (
              <a 
                href={`mailto:${item.content}`}
                className="block text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary transition-colors break-all"
              >
                {item.content}
              </a>
            ) : (
              <p className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                {item.content}
              </p>
            )}
          </div>

          <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-8 rounded-full bg-primary/20" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
