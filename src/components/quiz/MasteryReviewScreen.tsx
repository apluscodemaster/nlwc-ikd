"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Headphones,
  FileText,
  ArrowRight,
  SkipForward,
} from "lucide-react";
import { ResourceLink } from "./ResourceLink";
import { Button } from "@/components/ui/button";
import type { AnsweredQuestion, Recommendation } from "@/types/quiz";

interface MasteryReviewScreenProps {
  /** Only the correct questions from the batch */
  correctQuestions: AnsweredQuestion[];
  batchSize: number;
  onComplete: (numReviewed: number, numSkipped: number) => void;
  onAudioPlayed?: (questionId: string) => void;
}

export default function MasteryReviewScreen({
  correctQuestions,
  batchSize,
  onComplete,
  onAudioPlayed,
}: MasteryReviewScreenProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleAudioClick = useCallback(
    (questionId: string) => {
      setReviewedIds((prev) => new Set([...prev, questionId]));
      onAudioPlayed?.(questionId);
    },
    [onAudioPlayed],
  );

  const handleReviewAll = useCallback(() => {
    // Mark all as reviewed
    const allIds = new Set(correctQuestions.map((q) => q.question.id));
    setReviewedIds(allIds);
    // Expand the first one
    if (correctQuestions.length > 0) {
      setExpandedId(correctQuestions[0].question.id);
    }
  }, [correctQuestions]);

  const handleSkip = useCallback(() => {
    onComplete(reviewedIds.size, correctQuestions.length - reviewedIds.size);
  }, [correctQuestions.length, onComplete, reviewedIds.size]);

  const handleContinue = useCallback(() => {
    onComplete(reviewedIds.size, correctQuestions.length - reviewedIds.size);
  }, [correctQuestions.length, onComplete, reviewedIds.size]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            You nailed {correctQuestions.length}/{batchSize}. Lock in your wins?
          </h2>
          <p className="text-sm text-muted-foreground">
            Tap any question to review the explanation and deepen your
            understanding.
          </p>
        </div>

        {/* Question List */}
        <div className="space-y-3 mb-8">
          {correctQuestions.map((item, idx) => {
            const isExpanded = expandedId === item.question.id;
            const isReviewed = reviewedIds.has(item.question.id);

            return (
              <motion.div
                key={item.question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-2xl border overflow-hidden transition-colors ${
                  isReviewed
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                {/* Expandable Header */}
                <button
                  onClick={() => toggleExpand(item.question.id)}
                  className="w-full flex items-center gap-3 p-4 text-left cursor-pointer hover:bg-gray-100/50 transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600 shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 flex-1 line-clamp-2">
                    {item.question.question}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4">
                        {/* Correct Answer */}
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
                            Correct Answer
                          </p>
                          <p className="text-sm text-gray-900">
                            {item.question.options[item.correctAnswer]}
                          </p>
                        </div>

                        {/* Explanation */}
                        {item.explanation && (
                          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                              Why
                            </p>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {item.explanation}
                            </p>
                          </div>
                        )}

                        {/* Resources */}
                        {item.recommendations.length > 0 && (
                          <div className="space-y-2">
                            {item.recommendations.map((rec, rIdx) => {
                              const title =
                                rec.content?.title ?? rec.title ?? "Resource";
                              const hasAudio = rec.listen_url;
                              const hasTranscript = rec.read_url;

                              if (!hasAudio && !hasTranscript) return null;

                              return (
                                <div
                                  key={rIdx}
                                  className="p-3 rounded-xl border border-emerald-200 bg-white"
                                >
                                  <p className="font-semibold text-gray-900 text-xs mb-2">
                                    {title}
                                  </p>
                                    <div className="flex gap-2">
                                    {hasAudio && (
                                      <ResourceLink
                                        href={rec.listen_url || "#"}
                                        variant="listen"
                                        title={title}
                                        onClick={() =>
                                          handleAudioClick(item.question.id)
                                        }
                                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors active:scale-[0.97]"
                                      >
                                        <Headphones className="w-3 h-3" />
                                        Listen
                                      </ResourceLink>
                                    )}
                                    {hasTranscript && (
                                      <ResourceLink
                                        href={rec.read_url || "#"}
                                        variant="read"
                                        title={title}
                                        onClick={() =>
                                          handleAudioClick(item.question.id)
                                        }
                                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors active:scale-[0.97]"
                                      >
                                        <FileText className="w-3 h-3" />
                                        Read
                                      </ResourceLink>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 h-12 rounded-full font-bold cursor-pointer"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip
          </Button>
          {reviewedIds.size > 0 ? (
            <Button
              onClick={handleContinue}
              className="flex-1 h-12 rounded-full font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleReviewAll}
              className="flex-1 h-12 rounded-full font-bold cursor-pointer"
            >
              Review All <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
