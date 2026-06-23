"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SECURITY_QUESTIONS } from "@/lib/quizSecurity";

interface SecurityQuestionModalProps {
  sessionId: string;
  /** "set" shows a Skip option; "change" is for updating an existing question. */
  mode: "set" | "change";
  onClose: () => void;
  onSaved?: () => void;
}

export default function SecurityQuestionModal({
  sessionId,
  mode,
  onClose,
  onSaved,
}: SecurityQuestionModalProps) {
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (answer.trim().length < 2) {
      setError("Your answer must be at least 2 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/quiz/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question, answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save. Please try again.");
        setSaving(false);
        return;
      }
      onSaved?.();
      onClose();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
            {mode === "set"
              ? "Secure your progress"
              : "Update recovery question"}
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-5">
            Set a question only you can answer. It lets you continue your quiz on
            another device or after clearing your browser — no account needed.
          </p>

          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Security question
          </label>
          <div className="relative mb-4">
            <select
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full h-12 pl-4 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Your answer
          </label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          <p className="mt-2 text-xs text-gray-400">
            Not case-sensitive. Remember it exactly — you&rsquo;ll need it to
            recover your progress.
          </p>

          {error && (
            <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-full font-bold cursor-pointer mt-5"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "set" ? (
              "Save & continue"
            ) : (
              "Update question"
            )}
          </Button>

          {mode === "set" && (
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Skip for now
              <span className="block text-[11px] text-amber-600 mt-0.5">
                ⚠ Without this you can&rsquo;t recover your progress on a new
                device.
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
