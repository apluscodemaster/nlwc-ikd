"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Headphones } from "lucide-react";
import SermonsList from "./SermonsList";
import AudioSermonsList from "./AudioSermonsList";

type Tab = "audio" | "transcripts";

const tabs = [
  {
    id: "audio" as Tab,
    label: "Audio Messages",
    icon: Headphones,
    description: "Listen to powerful sermon recordings",
  },
  {
    id: "transcripts" as Tab,
    label: "Message Transcripts",
    icon: BookOpen,
    description: "Read full sermon transcripts",
  },
];

export default function SermonsPageContent() {
  const [activeTab, setActiveTab] = useState<Tab>("audio");

  return (
    <div className="space-y-10">
      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-2xl shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2.5 px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                  isActive
                    ? "text-white shadow-lg"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className={`absolute inset-0 rounded-xl ${
                      tab.id === "audio"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-indigo-200"
                        : "bg-gradient-to-r from-primary to-primary/90 shadow-primary/20"
                    } shadow-lg`}
                    transition={{
                      type: "spring",
                      damping: 25,
                      stiffness: 400,
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.id === "audio" ? "Audio" : "Transcripts"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Description */}
      <AnimatePresence mode="wait">
        <motion.p
          key={activeTab}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="text-center text-muted-foreground text-sm sm:text-base"
        >
          {tabs.find((t) => t.id === activeTab)?.description}
        </motion.p>
      </AnimatePresence>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === "audio" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === "audio" ? 20 : -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "audio" ? <AudioSermonsList /> : <SermonsList />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
