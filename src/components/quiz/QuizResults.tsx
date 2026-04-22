"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  AlertTriangle,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizResult } from "@/types/quiz";

interface QuizResultsProps {
  result: QuizResult;
  onRetry: () => void;
}

export default function QuizResults({ result, onRetry }: QuizResultsProps) {
  const pct = Math.round(
    (result.correct_answers / result.total_questions) * 100,
  );

  const grade =
    pct >= 80
      ? { label: "Excellent!", color: "text-emerald-500", emoji: "🎉" }
      : pct >= 60
        ? { label: "Good Job!", color: "text-blue-500", emoji: "👍" }
        : pct >= 40
          ? { label: "Keep Going!", color: "text-amber-500", emoji: "💪" }
          : { label: "Keep Studying!", color: "text-red-500", emoji: "📖" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50 text-center">
        {/* Score */}
        <div className="mb-6">
          <span className="text-5xl">{grade.emoji}</span>
          <h2 className={`text-2xl font-bold mt-3 ${grade.color}`}>
            {grade.label}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{pct}%</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <Trophy className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {result.correct_answers}/{result.total_questions}
            </p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
        </div>

        {/* Weak Areas */}
        {result.weak_areas.length > 0 && (
          <div className="mb-8 text-left">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Areas to Improve
            </h3>
            <div className="space-y-2">
              {result.weak_areas.map((area) => (
                <div
                  key={area.category}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {area.category}
                  </span>
                  <span className="text-xs font-bold text-amber-600">
                    {Math.round(area.fail_rate * 100)}% incorrect
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations.length > 0 && (
          <div className="mb-8 text-left">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Recommended Content
            </h3>
            <div className="space-y-2">
              {result.recommendations.map((rec) => (
                <a
                  key={rec.wp_post_id}
                  href={rec.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-800">
                    {rec.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rec.quiz_category}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Retry */}
        <Button
          onClick={onRetry}
          variant="outline"
          className="h-12 px-8 rounded-full font-bold cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </div>
    </motion.div>
  );
}
