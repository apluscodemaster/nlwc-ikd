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
import type { QuizResult, QuizCategory } from "@/types/quiz";

interface QuizResultsProps {
  result: QuizResult;
  onRetry: () => void;
}

export default function QuizResults({ result, onRetry }: QuizResultsProps) {
  const pct = result.score_percent;

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

        {/* Category Breakdown */}
        {Object.keys(result.by_category).length > 0 && (
          <div className="mb-8 text-left">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Areas to Improve
            </h3>
            <div className="space-y-2">
              {(Object.entries(result.by_category) as [QuizCategory, { correct: number; total: number }][])
                .filter(([, data]) => data.total > 0 && data.correct / data.total < 0.6)
                .map(([category, data]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {category}
                  </span>
                  <span className="text-xs font-bold text-amber-600">
                    {Math.round(((data.total - data.correct) / data.total) * 100)}% incorrect
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
              {result.recommendations.map((rec, idx) => (
                <a
                  key={idx}
                  href={rec.listen_url || rec.read_url || "#"}
                  className="block p-3 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-800">
                    {rec.content.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rec.category} · {rec.reason}
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
