"use client";

import React, { useState } from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const beliefs = [
  {
    title: "The Holy Scriptures",
    content:
      "We believe that the Holy Bible is the inspired, only infallible, authoritative Word of God, and that it is the ultimate source of truth and guidance for all people.",
    scripture: "2 Timothy 3:16-17",
  },
  {
    title: "The Trinity",
    content:
      "We believe that there is one God, eternally existent in three persons: Father, Son, and Holy Spirit.",
    scripture: "Matthew 28:19",
  },
  {
    title: "The Deity of Christ",
    content:
      "We believe in the deity of our Lord Jesus Christ, in His virgin birth, in His sinless life, in His miracles, in His vicarious and atoning death through His shed blood, in His bodily resurrection, in His ascension to the right hand of the Father, and in His personal return in power and glory.",
    scripture: "John 1:1, Philippians 2:6-11",
  },
  {
    title: "Salvation",
    content:
      "We believe that for the salvation of lost and sinful people, regeneration by the Holy Spirit is absolutely essential.",
    scripture: "Titus 3:5, Romans 10:9-10",
  },
  {
    title: "The Second Coming",
    content:
      "We believe in the personal, premillennial, and imminent return of our Lord and Savior Jesus Christ.",
    scripture: "1 Thessalonians 4:16-17",
  },
];

export default function BeliefsAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SectionContainer>
      <div className="grid lg:grid-cols-2 gap-16">
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
              — OUR DOCTRINE
            </h4>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
              What We <span className="text-primary">Believe</span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Our beliefs are centered on the foundational truths of the Christian
            faith. We are committed to teaching the Word of God in its entirety
            and helping our members grow in their understanding of these truths.
          </p>
        </div>

        <div className="space-y-4">
          {beliefs.map((belief, index) => (
            <div
              key={index}
              className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="text-xl font-bold text-gray-900">
                  {belief.title}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-primary transition-transform duration-300 ${
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
                    <div className="p-6 pt-0 border-t border-gray-50 bg-white">
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {belief.content}
                      </p>
                      <div className="inline-block px-3 py-1 bg-primary/5 text-primary text-sm font-bold rounded-full">
                        {belief.scripture}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
