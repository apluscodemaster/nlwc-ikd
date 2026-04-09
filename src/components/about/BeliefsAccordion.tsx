"use client";

import React, { useState } from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BookOpen, Sparkles } from "lucide-react";

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
    title: "Divine Healing",
    content:
      "We believe in divine healing through Faith in the word and the gifts of the spirit (gift of special kind of faith, gift of healings and working of miracle) as contained in the Holy scriptures.",
    scripture: "1 Corinthians 12:1–9",
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

  // Split beliefs into two groups for a true two-column "flow"
  // This prevents layout gaps caused by grid row alignment
  const halfway = Math.ceil(beliefs.length / 2);
  const leftColumn = beliefs.slice(0, halfway);
  const rightColumn = beliefs.slice(halfway);

  return (
    <SectionContainer className="relative overflow-hidden bg-gray-50/50">
      {/* Premium Background Accents */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold tracking-[0.2em] rounded-full mb-6 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Pillars of Faith
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Our Foundation &{" "}
            <span className="text-primary italic">Beliefs</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Rooted in the Holy Scriptures, our beliefs guide our journey of
            faith and our commitment to living out the Gospel in its fullness.
          </p>
        </motion.div>
      </div>

      {/* Two-Column Independent Layout */}
      <div className="grid lg:grid-cols-2 gap-x-8 items-start relative z-10">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {leftColumn.map((belief, idx) => (
            <AccordionItem
              key={idx}
              belief={belief}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {rightColumn.map((belief, idx) => {
            const globalIdx = idx + halfway;
            return (
              <AccordionItem
                key={globalIdx}
                belief={belief}
                isOpen={openIndex === globalIdx}
                onToggle={() =>
                  setOpenIndex(openIndex === globalIdx ? null : globalIdx)
                }
              />
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
}

function AccordionItem({
  belief,
  isOpen,
  onToggle,
}: {
  belief: (typeof beliefs)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group border rounded-3xl overflow-hidden transition-all duration-500 ease-in-out ${
        isOpen
          ? "border-primary/30 shadow-2xl shadow-primary/10 bg-white"
          : "border-gray-100 bg-white hover:border-primary/20 hover:shadow-xl"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between p-6 md:p-8 text-left transition-all duration-300"
        aria-expanded={isOpen}
      >
        <div className="flex gap-4 md:gap-6">
          <div
            className={`mt-1.5 w-1.5 h-6 rounded-full transition-all duration-500 ${
              isOpen
                ? "bg-primary scale-y-125"
                : "bg-gray-100 group-hover:bg-primary/30 scale-y-75"
            }`}
          />
          <span
            className={`text-lg md:text-xl font-bold transition-colors duration-300 leading-tight ${
              isOpen ? "text-primary" : "text-gray-900"
            }`}
          >
            {belief.title}
          </span>
        </div>
        <div
          className={`mt-1.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${
            isOpen
              ? "bg-primary text-white rotate-180"
              : "bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/5"
          }`}
        >
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-6 md:px-8 pb-8 pt-0 ml-6 md:ml-8">
              <div className="space-y-6">
                <div className="h-px w-full bg-linear-to-r from-gray-100 to-transparent" />
                <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-2xl">
                  {belief.content}
                </p>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <span
                    className="text-xs font-bold text-primary tracking-widest uppercase"
                    data-scripture-content
                  >
                    {belief.scripture}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
