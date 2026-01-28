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
    content: "Tuesday - Friday",
    description: "9:00 AM - 5:00 PM",
  },
];

const socials = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "Youtube" },
];

export default function ContactInfo() {
  return (
    <div className="space-y-12">
      <div className="grid sm:grid-cols-2 gap-8">
        {contactDetails.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4 p-6 rounded-3xl bg-gray-50 border border-gray-100"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {item.title}
              </h3>
              <p className="text-primary font-semibold mb-1">{item.content}</p>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-8 rounded-3xl bg-primary text-white">
        <h3 className="text-2xl font-bold mb-4">Connect on Social Media</h3>
        <p className="text-white/80 mb-8 max-w-md">
          Follow us for daily inspirations, live updates, and community news
          across all our social platforms.
        </p>
        <div className="flex gap-4">
          {socials.map((social, index) => (
            <motion.a
              key={index}
              href={social.href}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label={social.label}
            >
              <social.icon className="w-6 h-6" />
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
