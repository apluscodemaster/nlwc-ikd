"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Settings } from "lucide-react";
import { SETTINGS_SECTIONS } from "./sections";

export default function SettingsOverviewPage() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg shadow-gray-900/20">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Operational tools for the admin: the live schedule and the change
            history
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {SETTINGS_SECTIONS.map((section, i) => (
          <motion.div
            key={section.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={section.href}
              className="group flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all h-full"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <section.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  {section.label}
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
