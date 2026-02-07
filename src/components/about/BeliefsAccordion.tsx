"use client";

import React, { useState } from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const beliefs = [
  {
    title: "One God, One Lord, One Spirit",
    content: "One God, One Lord, One Spirit, One baptism and One Body.",
    scripture: "Ephesians 4:4–6; 1 Corinthians 12:13",
  },
  {
    title: "The Virgin Birth of Jesus",
    content: "We believe in the virgin birth of Jesus.",
    scripture: "Isaiah 7:14; Matthew 1:18–23",
  },
  {
    title: "Death, Resurrection & Ascension",
    content:
      "We believe Jesus died on the cross, rose on the third day and ascended to the right hand of the Father.",
    scripture: "1 Corinthians 15:3–4; Acts 1:9",
  },
  {
    title: "New Birth by Grace",
    content:
      "We believe in new birth as the work of grace through faith in the death, burial and resurrection of Jesus from the dead.",
    scripture: "Ephesians 2:8–9; Romans 6:4",
  },
  {
    title: "Baptism of the Holy Ghost",
    content:
      "We believe in the baptism of the Holy Ghost, an experience that all believers should have after the new birth experience, with the evidence of speaking in tongues. We believe in the nine gifts of the Spirit as a tool for edifying the church.",
    scripture: "Acts 2:4; Acts 10:44–46; Acts 19:6; 1 Corinthians 12",
  },
  {
    title: "The Fivefold Ministry",
    content:
      "We believe in the perfecting of the saints through the fivefold ministry.",
    scripture: "Ephesians 4:11–12",
  },
  {
    title: "The Nature of Man",
    content: "We believe man is a spirit, he has a soul and lives in the body.",
    scripture: "1 Thessalonians 5:23; Hebrews 4:12",
  },
  {
    title: "The Faith of the Son",
    content:
      "We believe in the Faith of the Son as the provision of God in the scriptures for the formation of Christ in the believers through the ministry of the Holy Spirit.",
    scripture: "Galatians 2:20",
  },
  {
    title: "Salvation of the Soul",
    content: "We believe in the Salvation of the Soul as the end of our Faith.",
    scripture: "1 Peter 1:9; Hebrews 10:39",
  },
  {
    title: "The Second Coming of Jesus",
    content:
      "We believe in the second coming of Jesus to His Church and for His Church.",
    scripture: "John 14:3; 1 Thessalonians 4:16–17; Titus 2:13",
  },
  {
    title: "Resurrection of the Dead",
    content: "We believe in the resurrection of the dead.",
    scripture: "1 Corinthians 15:52; John 5:28–29",
  },
  {
    title: "Eternal Judgment",
    content:
      "We believe in eternal judgment and eternal damnation for those who refuse the gift of salvation through faith in the death and resurrection of Jesus Christ.",
    scripture: "Hebrews 9:27; Matthew 25:46; Revelation 20:12–15",
  },
];

export default function BeliefsAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SectionContainer>
      {/* Centered Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h4 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">
          — PILLARS OF FAITH
        </h4>
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
          What We <span className="text-primary">Believe</span>
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Our beliefs are centered on the foundational truths of the Christian
          faith as revealed in the holy scriptures. We are committed to teaching
          the Word of God in its entirety and helping our members grow in their
          understanding of these truths.
        </p>
      </div>

      {/* Two-Column Accordion Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {beliefs.map((belief, index) => (
          <div
            key={index}
            className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="text-lg font-bold text-gray-900 pr-4">
                {belief.title}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-primary shrink-0 transition-transform duration-300 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-5 pt-0 border-t border-gray-50 bg-white">
                    <p className="text-muted-foreground leading-relaxed mb-3 text-sm">
                      {belief.content}
                    </p>
                    <div className="inline-block px-3 py-1 bg-primary/5 text-primary text-xs font-bold rounded-full">
                      {belief.scripture}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
