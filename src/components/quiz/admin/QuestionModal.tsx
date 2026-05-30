"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, X, Save, Loader2, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import type { QuizCategory, QuizQuestion } from "@/types/quiz";
import type { ModalMode } from "./types";

export function QuestionModal({
  mode,
  question,
  onClose,
  onSave,
  saving,
  categories,
}: {
  mode: ModalMode;
  question: QuizQuestion | null;
  onClose: () => void;
  onSave: (data: Partial<QuizQuestion>) => void;
  saving: boolean;
  categories: QuizCategory[];
}) {
  const [formQuestion, setFormQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [category, setCategory] = useState<QuizCategory>("Sunday Message");
  const [sermonRef, setSermonRef] = useState("");
  const [explain, setExplain] = useState("");

  useEffect(() => {
    if (question && mode === "edit") {
      setFormQuestion(question.question);
      setOptions([...question.options]);
      setCorrectAnswer(question.correctAnswer);
      setCategory(question.category);
      setSermonRef(question.sermon_ref || "");
      setExplain(question.explain || "");
    } else {
      setFormQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
      setCategory("Sunday Message");
      setSermonRef("");
      setExplain("");
    }
  }, [question, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQ = formQuestion.trim();
    const trimmedOpts = options.map((o) => o.trim()).filter(Boolean);

    if (!trimmedQ) {
      toast.error("Question text is required");
      return;
    }
    if (trimmedOpts.length !== 4) {
      toast.error("Exactly 4 options are required");
      return;
    }
    if (correctAnswer >= trimmedOpts.length) {
      toast.error("Please select a valid correct answer");
      return;
    }

    const data: Partial<QuizQuestion> = {
      question: trimmedQ,
      options: trimmedOpts,
      correctAnswer,
      category,
    };
    if (sermonRef.trim()) data.sermon_ref = sermonRef.trim();
    if (explain.trim()) data.explain = explain.trim();
    if (mode === "edit" && question) data.id = question.id;

    onSave(data);
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            {mode === "create" ? "Add Question" : "Edit Question"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Question text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question *
            </label>
            <textarea
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              placeholder="Enter the quiz question..."
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as QuizCategory)}
              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Answer Options * (click radio to mark correct)
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(idx)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      correctAnswer === idx
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                    title={
                      correctAnswer === idx
                        ? "Correct answer"
                        : "Mark as correct"
                    }
                  >
                    {correctAnswer === idx && (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...options];
                      updated[idx] = e.target.value;
                      setOptions(updated);
                    }}
                    className="flex-1 h-10 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sermon reference (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sermon/Transcript Ref{" "}
              <span className="text-gray-400 font-normal">(optional slug)</span>
            </label>
            <input
              type="text"
              value={sermonRef}
              onChange={(e) => setSermonRef(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="e.g. the-power-of-faith"
            />
          </div>

          {/* Explanation (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Explanation{" "}
              <span className="text-gray-400 font-normal">
                (shown after quiz completion)
              </span>
            </label>
            <textarea
              value={explain}
              onChange={(e) => setExplain(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              placeholder="Explain the correct answer and why other options are incorrect. This helps users learn from their mistakes."
            />
            <p className="mt-1 text-xs text-gray-500">
              {explain.length} characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving
                ? "Saving…"
                : mode === "create"
                  ? "Create Question"
                  : "Update Question"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-6 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
