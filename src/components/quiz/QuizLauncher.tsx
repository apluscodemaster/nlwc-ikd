"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  BookOpen,
  GraduationCap,
  Church,
  Sparkles,
  ArrowRight,
  Loader2,
  Flame,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizCategory } from "@/types/quiz";

interface QuizLauncherProps {
  onStart: (category: QuizCategory | null) => void;
  loading?: boolean;
  username?: string;
}

// Icon mapping for known categories
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Sunday Message": <Church className="w-5 h-5" />,
  "Sunday School": <GraduationCap className="w-5 h-5" />,
  "Bible Study": <BookOpen className="w-5 h-5" />,
  "Special Meeting": <Brain className="w-5 h-5" />,
  "Season of the Spirit": <Flame className="w-5 h-5" />,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Sunday Message": "Test your knowledge of Sunday sermons",
  "Sunday School": "Recall Sunday School lessons",
  "Bible Study": "Weekly Bible study teachings",
  "Special Meeting": "Conferences & special meetings",
  "Season of the Spirit": "Review messages from annual SOTS meetings",
};

export default function QuizLauncher({
  onStart,
  loading,
  username,
}: QuizLauncherProps) {
  const [selected, setSelected] = useState<QuizCategory | null>(null);
  const [categoryList, setCategoryList] = useState<
    {
      value: QuizCategory | null;
      label: string;
      icon: React.ReactNode;
      description: string;
    }[]
  >([
    {
      value: null,
      label: "All Categories",
      icon: <Sparkles className="w-5 h-5" />,
      description: "Random mix of all topics",
    },
    {
      value: "Sunday Message",
      label: "Sunday Message",
      icon: CATEGORY_ICONS["Sunday Message"],
      description: CATEGORY_DESCRIPTIONS["Sunday Message"],
    },
    {
      value: "Sunday School",
      label: "Sunday School",
      icon: CATEGORY_ICONS["Sunday School"],
      description: CATEGORY_DESCRIPTIONS["Sunday School"],
    },
    {
      value: "Bible Study",
      label: "Bible Study",
      icon: CATEGORY_ICONS["Bible Study"],
      description: CATEGORY_DESCRIPTIONS["Bible Study"],
    },
    {
      value: "Special Meeting",
      label: "Special Meeting",
      icon: CATEGORY_ICONS["Special Meeting"],
      description: CATEGORY_DESCRIPTIONS["Special Meeting"],
    },
    {
      value: "Season of the Spirit",
      label: "Season of the Spirit",
      icon: CATEGORY_ICONS["Season of the Spirit"],
      description: CATEGORY_DESCRIPTIONS["Season of the Spirit"],
    },
  ]);

  // Fetch dynamic categories from DB
  useEffect(() => {
    fetch("/api/quiz/admin/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { name: string }[] | null) => {
        if (!data || !Array.isArray(data) || data.length === 0) return;
        const items: typeof categoryList = [
          {
            value: null,
            label: "All Categories",
            icon: <Sparkles className="w-5 h-5" />,
            description: "Random mix of all topics",
          },
          ...data.map((c) => ({
            value: c.name as QuizCategory,
            label: c.name,
            icon: CATEGORY_ICONS[c.name] || <Tag className="w-5 h-5" />,
            description:
              CATEGORY_DESCRIPTIONS[c.name] || `Questions from ${c.name}`,
          })),
        ];
        setCategoryList(items);
      })
      .catch(() => {});
  }, []);

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
          {username && (
            <p className="text-base font-semibold text-primary mb-1">
              Welcome, {username}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Test what you&rsquo;ve learned from services and messages
          </p>
        </div>

        {/* Category Selection */}
        <div className="mb-8">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
            Choose Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryList.map((cat) => {
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

        {/* Start */}
        <Button
          onClick={() => onStart(selected)}
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
