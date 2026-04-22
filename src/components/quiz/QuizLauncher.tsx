"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  BookOpen,
  GraduationCap,
  Church,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizCategory } from "@/types/quiz";

interface QuizLauncherProps {
  onStart: (category: QuizCategory | null, count: number) => void;
  loading?: boolean;
}

const CATEGORIES: {
  value: QuizCategory | null;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: null,
    label: "All Categories",
    icon: <Sparkles className="w-5 h-5" />,
    description: "Random mix of all topics",
  },
  {
    value: "Sunday Message",
    label: "Sunday Message",
    icon: <Church className="w-5 h-5" />,
    description: "Test your knowledge of Sunday sermons",
  },
  {
    value: "Sunday School",
    label: "Sunday School",
    icon: <GraduationCap className="w-5 h-5" />,
    description: "Recall Sunday School lessons",
  },
  {
    value: "Bible Study",
    label: "Bible Study",
    icon: <BookOpen className="w-5 h-5" />,
    description: "Midweek Bible study topics",
  },
  {
    value: "Special Meeting",
    label: "Special Meeting",
    icon: <Brain className="w-5 h-5" />,
    description: "Conferences & special events",
  },
];

const COUNTS = [5, 10, 15, 20];

export default function QuizLauncher({ onStart, loading }: QuizLauncherProps) {
  const [selected, setSelected] = useState<QuizCategory | null>(null);
  const [count, setCount] = useState(10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Church Knowledge Quiz
          </h2>
          <p className="text-sm text-muted-foreground">
            Test what you&rsquo;ve learned from services and messages
          </p>
        </div>

        {/* Category Selection */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
            Choose Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected =
                selected === cat.value ||
                (selected === null && cat.value === null);
              return (
                <button
                  key={cat.label}
                  onClick={() => setSelected(cat.value)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-gray-200 hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 ${isSelected ? "text-primary" : "text-gray-400"}`}
                  >
                    {cat.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {cat.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Count */}
        <div className="mb-8">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
            Number of Questions
          </label>
          <div className="flex gap-2">
            {COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  count === c
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Start */}
        <Button
          onClick={() => onStart(selected, count)}
          disabled={loading}
          className="w-full h-12 rounded-full font-bold cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Start Quiz <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
