"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  X,
  AlertCircle,
  Headphones,
  FileText,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { QuizQuestion, Recommendation } from "@/types/quiz";

interface FailedQuestionOverlayProps {
  question: QuizQuestion;
  selectedAnswer: number;
  correctAnswer: number;
  explanation?: string;
  recommendations: Recommendation[];
  onContinue: () => void;
}

export default function FailedQuestionOverlay({
  question,
  selectedAnswer,
  correctAnswer,
  explanation,
  recommendations,
  onContinue,
}: FailedQuestionOverlayProps) {
  const userAnswerText = question.options[selectedAnswer];
  const correctAnswerText = question.options[correctAnswer];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Question Missed</h2>
            </div>
          </div>
          <p className="text-white/90 text-sm">
            Don&apos;t worry! Study the recommended resources and come back to
            try again.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Question Display */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
              Question
            </p>
            <p className="text-lg font-semibold text-gray-900 mb-4">
              {question.question}
            </p>

            {/* Answer Comparison */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">
                  Your Answer (Incorrect)
                </p>
                <p className="text-sm text-gray-900">{userAnswerText}</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                  Correct Answer
                </p>
                <p className="text-sm text-gray-900">{correctAnswerText}</p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          {explanation && (
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">
                Why?
              </p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {explanation}
              </p>
            </div>
          )}

          {/* Recommended Resources */}
          {recommendations.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
                Study These Resources
              </p>
              <div className="space-y-3">
                {recommendations.map((rec, idx) => {
                  const title = rec.content?.title ?? rec.title ?? "Resource";
                  const hasAudio = rec.listen_url;
                  const hasTranscript = rec.read_url;

                  if (!hasAudio && !hasTranscript) return null;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                    >
                      <p className="font-semibold text-gray-900 text-sm mb-2">
                        {title}
                      </p>
                      <p className="text-xs text-gray-600 mb-3">
                        {rec.category} • {rec.reason}
                      </p>

                      <div className="flex gap-2">
                        {hasAudio && (
                          <Link
                            href={rec.listen_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors active:scale-[0.97]"
                          >
                            <Headphones className="w-3.5 h-3.5" />
                            Listen
                          </Link>
                        )}
                        {hasTranscript && (
                          <Link
                            href={rec.read_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors active:scale-[0.97]"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Read
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onContinue}
              className="flex-1 h-12 rounded-full font-bold cursor-pointer"
            >
              Back to Quiz <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
