"use client";

import React, { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuestionCard from "./QuestionCard";
import type { QuizQuestion, QuizResult, QuizCategory } from "@/types/quiz";

interface QuizPlayerProps {
  questions: Omit<QuizQuestion, "correctAnswer">[];
  sessionId: string;
  category: QuizCategory | null;
  onComplete: (result: QuizResult) => void;
}

interface Answer {
  question_id: string;
  category: string;
  selected_answer: number;
}

export default function QuizPlayer({
  questions,
  sessionId,
  onComplete,
}: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<number | undefined>();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleSelect = useCallback((index: number) => {
    setSelectedAnswer(index);
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedAnswer === null || !current) return;

    const answer: Answer = {
      question_id: current.id,
      category: current.category,
      selected_answer: selectedAnswer,
    };

    setAnswers((prev) => [...prev, answer]);
    // We don't know correctAnswer on the client — will be revealed in results
    setRevealed(false);

    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setCorrectAnswer(undefined);
    }
  }, [selectedAnswer, current, isLast]);

  const handleSubmit = useCallback(async () => {
    if (selectedAnswer === null || !current) return;

    // Add last answer
    const finalAnswers = [
      ...answers,
      {
        question_id: current.id,
        category: current.category,
        selected_answer: selectedAnswer,
      },
    ];

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          answers: finalAnswers,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit quiz");
      }

      const result: QuizResult = await res.json();
      onComplete(result);
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitting(false);
    }
  }, [selectedAnswer, current, answers, sessionId, onComplete]);

  if (!current) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50">
        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentIndex}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            question={current.question}
            options={current.options}
            selectedAnswer={selectedAnswer}
            correctAnswer={correctAnswer}
            revealed={revealed}
            onSelect={handleSelect}
          />
        </AnimatePresence>

        {/* Action Button */}
        <motion.div
          className="mt-8 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: selectedAnswer !== null ? 1 : 0.4 }}
        >
          {isLast ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || submitting}
              className="h-12 px-8 rounded-full font-bold cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Submit Quiz <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={selectedAnswer === null}
              className="h-12 px-8 rounded-full font-bold cursor-pointer"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
