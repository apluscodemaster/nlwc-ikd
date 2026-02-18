"use client";

import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import ContactForm from "@/components/contact/ContactForm";
import ContactInfo from "@/components/contact/ContactInfo";
import MapEmbed from "@/components/contact/MapEmbed";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <main>
      <PageHeader
        title="Get in Touch"
        subtitle="We're here to listen, pray for you, and welcome you into our community. Reach out to us anytime."
        backgroundImage="https://images.unsplash.com/photo-1529070538774-1571d6de0845?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer>
        <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-4 mb-8 md:mb-12">
              <h4 className="text-primary font-bold uppercase tracking-widest text-xs md:text-sm">
                — CONTACT US
              </h4>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                Let&apos;s Start a <br />
                <span className="text-primary">Conversation</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Whether you have a specific question about our meetings, a
                strong desire to abound in the knowledge of God, or just want to
                say hello, we value every connection.
              </p>
            </div>

            <ContactInfo />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </SectionContainer>

      <SectionContainer
        className="bg-gray-50"
        containerClassName="max-w-none px-0 sm:px-0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 md:mb-12">
          <h4 className="text-primary font-bold uppercase tracking-widest text-xs md:text-sm mb-4">
            — VISIT US
          </h4>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Find Your Way Home
          </h2>
        </div>
        <div className="h-[350px] md:h-[500px] w-full mt-8">
          <MapEmbed />
        </div>
      </SectionContainer>
    </main>
  );
}
