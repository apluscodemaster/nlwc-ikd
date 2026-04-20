"use client";

import React from "react";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import ContactForm from "@/components/contact/ContactForm";
import ContactInfo, { SocialConnect } from "@/components/contact/ContactInfo";
import MapEmbed from "@/components/contact/MapEmbed";
import { motion } from "framer-motion";
import { PenLine, BookOpen } from "lucide-react";

export default function ContactPage() {
  return (
    <main>
      <PageHeader
        title="Get in Touch"
        subtitle="We're here to listen, pray for you, and welcome you into our community. Reach out to us anytime."
        backgroundImage="https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247564/nlwc-ikd-assets/zaxi2cv9e51ooer7uvrl.jpg"
      />

      <SectionContainer containerClassName="max-w-7xl">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 md:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-3 md:space-y-4 mb-8 md:mb-10 text-center lg:text-left">
              <h4 className="text-primary font-bold uppercase tracking-widest text-[10px] md:text-sm">
                — CONTACT US
              </h4>
              <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.1]">
                Let&apos;s Start a <br className="hidden xs:block" />
                <span className="text-primary">Conversation</span>
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Whether you have a specific question about our meetings, a
                strong desire to abound in the knowledge of God, or just want to
                say hello, we value every connection.
              </p>
            </div>

            <ContactInfo />

            {/* Testimony Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-row gap-2 xs:gap-3 mt-6"
            >
              <Link
                href="/testimonies#share"
                className="group flex-1 h-12 sm:h-14 flex items-center justify-center gap-1.5 xs:gap-2 px-2 xs:px-4 sm:px-6 rounded-full bg-primary text-white font-bold text-[9px] xs:text-[11px] sm:text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <PenLine className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 group-hover:rotate-[-8deg] transition-transform shrink-0" />
                Share Testimony
              </Link>
              <Link
                href="/testimonies#view"
                className="group flex-1 h-12 sm:h-14 flex items-center justify-center gap-1.5 xs:gap-2 px-2 xs:px-4 sm:px-6 rounded-full border-2 border-primary text-primary font-bold text-[9px] xs:text-[11px] sm:text-sm hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <BookOpen className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 group-hover:rotate-[5deg] transition-transform shrink-0" />
                View Testimonies
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:mt-0"
          >
            <div className="lg:hidden mb-8 h-px bg-gray-100 w-1/2 mx-auto" />
            <ContactForm />
          </motion.div>
        </div>
      </SectionContainer>

      <SectionContainer containerClassName="max-w-7xl" className="pt-0 md:pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <SocialConnect />
        </motion.div>
      </SectionContainer>

      <SectionContainer
        className="bg-gray-50 border-t border-gray-100 pb-0"
        containerClassName="max-w-none px-0"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 mb-8 md:mb-12">
          <h4 className="text-primary font-bold uppercase tracking-widest text-[10px] md:text-sm mb-2">
            — VISIT US
          </h4>
          <h2 className="text-xl xs:text-2xl md:text-3xl font-bold text-gray-900">
            Find Your Way Home
          </h2>
        </div>
        <div className="h-[300px] xs:h-[400px] md:h-[600px] w-full">
          <MapEmbed />
        </div>
      </SectionContainer>
    </main>
  );
}
