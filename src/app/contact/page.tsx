"use client";

import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import ContactForm from "@/components/contact/ContactForm";
import ContactInfo, { SocialConnect } from "@/components/contact/ContactInfo";
import MapEmbed from "@/components/contact/MapEmbed";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <main>
      <PageHeader
        title="Get in Touch"
        subtitle="We're here to listen, pray for you, and welcome you into our community. Reach out to us anytime."
        backgroundImage="/contact-hero.jpg"
      />

      <SectionContainer containerClassName="max-w-screen-2xl">
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

      <SectionContainer containerClassName="max-w-screen-2xl" className="pt-0 md:pt-4">
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
