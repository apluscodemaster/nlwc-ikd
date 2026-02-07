"use client";

import React from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { BookOpen, Users, Church, Heart } from "lucide-react";

const textVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const whatWeStandFor = [
  {
    icon: Church,
    title: "A Mission Church",
    description:
      "Taking the word of righteousness to believers in the body of Christ through outreaches, evangelism, crusades, and church planting.",
  },
  {
    icon: BookOpen,
    title: "Discipleship",
    description:
      "We disciple believers through the Sunday school platform, grounding them in the word of God.",
  },
  {
    icon: Users,
    title: "Teaching & Preaching",
    description:
      "We build believers by the teaching and preaching of the word of righteousness.",
  },
  {
    icon: Heart,
    title: "Strong Families",
    description:
      "We believe families and marriages should be strengthened for the building of healthy local assemblies.",
  },
];

export default function StorySection() {
  return (
    <>
      <SectionContainer>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={textVariants}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
                — WHO WE ARE
              </h4>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                A New Testament <span className="text-primary">Church</span>,{" "}
                <br className="hidden sm:block" />
                Built on <span className="text-primary">Truth</span>
              </h2>
            </div>

            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                The New and Living Way Church is a New Testament church whose
                doctrine is built upon the truth of the holy scriptures of the
                New Testament Apostles and Prophets. The church is built on the
                tenets of the Word of Righteousness doctrine.
              </p>
            </div>

            <div className="space-y-6 pt-8 border-t border-gray-100">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Our Vision
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  The Lord, by the Spirit through the Lead Pastor, ordained the
                  New and Living Way Church to be a church that can take any
                  believer from any level of growth to experience life within
                  the veil—the fullness of God&apos;s Life in the Most Holy
                  Place.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Our Mission
                </h3>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>This shall be realized through:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <strong>Mission</strong> – Taking the word of
                      righteousness to believers through outreaches.
                    </li>
                    <li>
                      <strong>Evangelism & Crusades</strong> – Reaching the lost
                      and Church Planting.
                    </li>
                    <li>
                      <strong>Sunday School</strong> – Discipling the saints in
                      the word of God.
                    </li>
                    <li>
                      <strong>Family Ministry</strong> – Building strong
                      marriages and family life for a strong local Assembly.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={imageVariants}
            className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl"
          >
            <Image
              src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1000&auto=format&fit=crop"
              alt="Church Community"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      </SectionContainer>

      {/* What We Stand For Section */}
      <SectionContainer className="bg-linear-to-b from-gray-50/50 to-white">
        <div className="text-center mb-12">
          <h4 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">
            — OUR IDENTITY
          </h4>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            What We <span className="text-primary">Stand For</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whatWeStandFor.map((item, index) => (
            <motion.div
              key={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </SectionContainer>
    </>
  );
}
