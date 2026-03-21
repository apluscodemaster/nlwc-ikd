"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, ChevronRight } from "lucide-react";
import { resources } from "@/data/resources";

export default function ResourceList() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {resources.map((resource, index) => (
        <motion.div
          key={resource.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <resource.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                  {resource.title}
                </h3>
                <span className="px-3 py-1 bg-gray-100 text-[10px] font-black uppercase tracking-widest text-muted-foreground rounded-full">
                  {resource.category}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                <span>{resource.date}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>{resource.size}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>{resource.fileType}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <button className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-gray-50 text-gray-900 font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm">
              <Download className="w-4 h-4" />
              Download
            </button>
            <button className="hidden sm:flex w-12 h-12 rounded-xl border border-gray-100 items-center justify-center text-muted-foreground hover:bg-gray-50 hover:text-primary transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
