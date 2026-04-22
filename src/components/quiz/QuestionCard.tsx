"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: string[];
  selectedAnswer: number | null;
  correctAnswer?: number; // only shown after answering
  revealed: boolean;
  onSelect: (index: number) => void;
}

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  options,
  selectedAnswer,
  correctAnswer,
  revealed,
  onSelect,
}: QuestionCardProps) {
  return (
    <motion.div
      key={questionNumber}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="h-2 flex-1 mx-4 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${(questionNumber / totalQuestions) * 100}%`,
            }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Question */}
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 leading-snug">
        {question}
      </h3>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, i) => {
          let borderClass = "border-gray-200 hover:border-primary/40";
          let bgClass = "bg-white hover:bg-primary/5";
          let iconEl = null;

          if (revealed && correctAnswer !== undefined) {
            if (i === correctAnswer) {
              borderClass = "border-emerald-400";
              bgClass = "bg-emerald-50";
              iconEl = (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              );
            } else if (i === selectedAnswer && i !== correctAnswer) {
              borderClass = "border-red-400";
              bgClass = "bg-red-50";
              iconEl = <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
            }
          } else if (selectedAnswer === i) {
            borderClass = "border-primary ring-2 ring-primary/20";
            bgClass = "bg-primary/5";
          }

          return (
            <button
              key={i}
              onClick={() => !revealed && onSelect(i)}
              disabled={revealed}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer disabled:cursor-default ${borderClass} ${bgClass}`}
            >
              <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm font-medium text-gray-800 flex-1">
                {option}
              </span>
              {iconEl}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
