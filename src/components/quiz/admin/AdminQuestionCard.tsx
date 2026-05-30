"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import type { QuizQuestion } from "@/types/quiz";

export function AdminQuestionCard({
  question,
  onEdit,
  onDelete,
  deleting,
}: {
  question: QuizQuestion;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wide">
              {question.category}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors cursor-pointer"
              title="Edit question"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
              title="Delete question"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <p className="text-sm font-medium text-gray-900 leading-relaxed">
          {question.question}
        </p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {expanded ? "Hide options" : "Show options"}
        </button>
      </div>

      {/* Options (collapsible) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-1.5">
              {question.options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    idx === question.correctAnswer
                      ? "bg-green-50 text-green-800 font-semibold"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border border-current/20">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {idx === question.correctAnswer && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  )}
                </div>
              ))}
              {question.sermon_ref && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  <BookOpen className="w-3 h-3 inline mr-1" />
                  Ref: {question.sermon_ref}
                </p>
              )}
              {question.explain && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-[11px] font-semibold text-gray-700 mb-1">
                    Explanation:
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {question.explain}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
