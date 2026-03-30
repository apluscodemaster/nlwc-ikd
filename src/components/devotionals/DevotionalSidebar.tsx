"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Calendar, ChevronRight, History } from "lucide-react";
import { getPublishedDevotionals, Devotional } from "@/lib/devotionals";

interface DevotionalSidebarProps {
  currentId: string;
}

export default function DevotionalSidebar({
  currentId,
}: DevotionalSidebarProps) {
  const [recent, setRecent] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedDevotionals(5).then((result) => {
      // Filter out the current one
      setRecent(
        result.devotionals.filter((d) => d.id !== currentId).slice(0, 4),
      );
      setLoading(false);
    });
  }, [currentId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Recent Devotionals
        </h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (recent.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <History className="w-5 h-5 text-primary" />
        Recent Devotionals
      </h3>

      <div className="space-y-3">
        {recent.map((d, index) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={`/devotionals/${d.id}`}
              className="group flex flex-col p-4 rounded-2xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                <Calendar className="w-3 h-3" />
                {d.scheduledDate.toDate().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                {d.title}
              </h4>
              <div className="mt-3 flex items-center justify-end">
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <Link
        href="/devotionals"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gray-50 text-sm font-bold text-gray-600 hover:bg-primary/5 hover:text-primary transition-all border border-dashed border-gray-200"
      >
        <BookOpen className="w-4 h-4" />
        View All Archive
      </Link>
    </div>
  );
}
