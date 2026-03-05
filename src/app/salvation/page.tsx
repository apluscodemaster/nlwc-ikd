"use client";

import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import { motion, Variants } from "framer-motion";
import { Heart, Flame, BookOpen, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function SalvationPage() {
  return (
    <main>
      <PageHeader
        title="Become Born-Again Today"
        subtitle="Receive Jesus into your heart and begin your eternal journey with God."
        backgroundImage="https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=2070&auto=format&fit=crop"
      />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="space-y-16"
        >
          {/* Intro */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              You Can Pray <span className="text-primary">Now!</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              God loves you and wants you to have a personal relationship with
              Him. The following prayer will guide you into that new life in
              Christ.
            </p>
          </motion.div>

          {/* Prayer of Salvation */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-3xl bg-gray-50 border border-gray-100 p-8 sm:p-12 overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-amber-400 to-primary" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Prayer of Salvation
              </h3>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
              <p className="italic text-gray-600 border-l-4 border-primary/30 pl-6">
                Heavenly Father, I come to you in the name of Jesus. Your Word
                says, &ldquo;Whosoever shall call upon the name of the Lord
                shall be saved&rdquo;{" "}
                <span className="font-semibold text-primary">(Acts 2:21)</span>.
                I am calling on you.
              </p>

              <p>
                I pray and ask Jesus to come into my heart and be Lord over my
                life according to{" "}
                <span className="font-semibold text-primary">
                  Romans 10:9-10
                </span>
                : &ldquo;If thou shalt confess with thy mouth the Lord Jesus,
                and shalt believe in thine heart that God hath raised him from
                the dead, thou shalt be saved. For with the heart man believeth
                unto righteousness; and with the mouth, confession is made unto
                salvation.&rdquo;
              </p>

              <p className="font-semibold text-gray-900 text-xl">
                I do that now. I believe in my heart that God raised Him from
                the dead. I am now reborn! I am a Christian — a child of the
                Almighty God. I am saved!
              </p>
            </div>
          </motion.div>

          {/* Prayer for Holy Ghost Baptism */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 sm:p-12 overflow-hidden"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3"
            />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">
                  Prayer for Baptism of the Holy Ghost
                </h3>
              </div>

              <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                <p className="italic border-l-4 border-primary/40 pl-6">
                  You also said in your Word, &ldquo;If ye then, being evil,
                  know how to give good gifts unto your children: HOW MUCH MORE
                  shall your heavenly Father give the Holy Spirit to them that
                  ask him?&rdquo;{" "}
                  <span className="font-semibold text-primary">
                    (Luke 11:13)
                  </span>
                </p>

                <p>
                  I&apos;m also asking you to fill me with the Holy Spirit. Holy
                  Spirit, rise up within me as I praise God. I fully expect to
                  speak with other tongues as you give me utterance{" "}
                  <span className="font-semibold text-primary">(Acts 2:4)</span>
                  .
                </p>

                <p className="font-bold text-white text-xl">
                  In Jesus&apos; name. Amen!
                </p>

                <p className="text-primary font-semibold">
                  Begin to praise God for filling you with the Holy Spirit!
                </p>
              </div>
            </div>
          </motion.div>

          {/* What's Next */}
          <motion.div variants={itemVariants} className="text-center space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">
              What&apos;s Next?
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Congratulations on making the most important decision of your
              life! We&apos;d love to walk with you on this journey. Connect
              with us today.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 h-14 text-md font-bold shadow-xl"
              >
                <Link href="/contact" className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Contact Us
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-14 text-md font-bold"
              >
                <Link href="/sermons">Listen to Messages</Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
