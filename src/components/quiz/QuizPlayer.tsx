"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuestionCard from "./QuestionCard";
import QuizProgressBar from "./QuizProgressBar";
import FailedQuestionOverlay from "./FailedQuestionOverlay";
import type {
  QuizQuestion,
  QuizResult,
  QuizCategory,
  Recommendation,
} from "@/types/quiz";

interface QuizPlayerProps {
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
  sessionId,
  category,
  onComplete,
}: QuizPlayerProps) {
  const [current, setCurrent] = useState<Omit<
    QuizQuestion,
    "correctAnswer"
  > | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<number | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [showFailedOverlay, setShowFailedOverlay] = useState(false);
  const [noMoreQuestions, setNoMoreQuestions] = useState(false);
  const [failedQuestionData, setFailedQuestionData] = useState<{
    question: QuizQuestion;
    selectedAnswer: number;
    correctAnswer: number;
    explanation?: string;
    recommendations: Recommendation[];
  } | null>(null);

  // Mutable ref is the SINGLE SOURCE OF TRUTH for answered IDs.
  // Updated synchronously before fetching next question to prevent repeats.
  const answeredIdsRef = useRef<Set<string>>(new Set());

  const initializedRef = useRef(false);

  // Fetch a new question — excludes all IDs currently in the ref
  const fetchNextQuestion = useCallback(async () => {
    setLoadingQuestion(true);
    setNoMoreQuestions(false);
    try {
      const params = new URLSearchParams({ count: "1" });
      if (category) params.set("category", category);

      // Read the ref directly — always has the latest answered IDs
      if (answeredIdsRef.current.size > 0) {
        params.set("exclude", Array.from(answeredIdsRef.current).join(","));
      }

      const res = await fetch(`/api/quiz/questions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch question");

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        console.warn("No more questions available in question bank");
        setNoMoreQuestions(true);
        setCurrent(null);
        return;
      }

      setCurrent(data[0]);
      setSelectedAnswer(null);
      setCorrectAnswer(undefined);
      setRevealed(false);
    } catch (error) {
      console.error("Failed to load question:", error);
      setNoMoreQuestions(true);
      setCurrent(null);
    } finally {
      setLoadingQuestion(false);
    }
  }, [category]);

  // Load first question on mount only
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchNextQuestion();
    }
  }, [fetchNextQuestion]);

  const handleSelect = useCallback((index: number) => {
    setSelectedAnswer(index);
  }, []);

  // Fetch recommendations for a failed question
  const fetchRecommendations = useCallback(
    async (sermonRef?: string, questionCategory?: string): Promise<Recommendation[]> => {
      try {
        const params = new URLSearchParams();
        if (sermonRef) {
          params.set("sermon_ref", sermonRef);
        }
        params.set("category", questionCategory || current?.category || "");

        const res = await fetch(
          `/api/quiz/recommendations?${params.toString()}`,
        );
        if (!res.ok) return [];
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        return [];
      }
    },
    [current],
  );

  const handleConfirm = useCallback(async () => {
    if (selectedAnswer === null || !current) return;

    setSubmitting(true);
    try {
      // Save answer immediately to the server
      const saveRes = await fetch("/api/quiz/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          answer: {
            question_id: current.id,
            category: current.category,
            selected_answer: selectedAnswer,
          },
        }),
      });

      if (!saveRes.ok) throw new Error("Failed to save answer");

      const { is_correct, correct_answer, explanation } = await saveRes.json();

      // ALWAYS mark the current question as answered in the ref SYNCHRONOUSLY
      // before fetching the next question — prevents repeats
      answeredIdsRef.current = new Set([...answeredIdsRef.current, current.id]);

      if (is_correct) {
        // Correct answer - increment and move to next question
        setCorrect((prev) => prev + 1);
        setTotal((prev) => prev + 1);
        setRevealed(false);
        setSelectedAnswer(null);
        await fetchNextQuestion();
      } else {
        // Wrong answer - show failed overlay
        setTotal((prev) => prev + 1);
        setCorrectAnswer(correct_answer);
        setRevealed(true);

        const recs = await fetchRecommendations(current.sermon_ref, current.category);

        // Create complete question object with correctAnswer
        const fullQuestion: QuizQuestion = {
          ...current,
          correctAnswer: correct_answer,
        };

        setFailedQuestionData({
          question: fullQuestion,
          selectedAnswer,
          correctAnswer: correct_answer,
          explanation,
          recommendations: recs,
        });
        setShowFailedOverlay(true);
      }
    } catch (error) {
      console.error("Confirm error:", error);
    } finally {
      setSubmitting(false);
    }
  }, [
    selectedAnswer,
    current,
    sessionId,
    fetchNextQuestion,
    fetchRecommendations,
  ]);

  const handleContinueAfterFailed = useCallback(async () => {
    setShowFailedOverlay(false);
    setFailedQuestionData(null);
    setSelectedAnswer(null);
    setCorrectAnswer(undefined);
    await fetchNextQuestion();
  }, [fetchNextQuestion]);

  const handleFinishQuiz = useCallback(async () => {
    setSubmitting(true);
    try {
      // Fetch current progress/results
      const res = await fetch(`/api/quiz/progress?session_id=${sessionId}`);
      if (!res.ok) throw new Error("Failed to get results");

      const result: QuizResult = await res.json();
      onComplete(result);
    } catch (error) {
      console.error("Finish error:", error);
      setSubmitting(false);
    }
  }, [sessionId, onComplete]);

  if (loadingQuestion && !current) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50 flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (noMoreQuestions && !current) {
    return (
      <div className="max-w-2xl mx-auto">
        <QuizProgressBar correct={correct} total={total} current={total} />
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              No More Questions Available
            </h3>
            <p className="text-gray-600">
              You&apos;ve answered all available questions in this category.
            </p>
            <div className="pt-4">
              <Button
                onClick={handleFinishQuiz}
                disabled={submitting}
                className="h-12 px-8 rounded-full font-bold cursor-pointer"
              >
                View Results
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress Bar */}
        <QuizProgressBar correct={correct} total={total} current={total + 1} />

        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50">
          <AnimatePresence mode="wait">
            <QuestionCard
              key={current.id}
              questionNumber={total + 1}
              totalQuestions={0}
              question={current.question}
              options={current.options}
              selectedAnswer={selectedAnswer}
              correctAnswer={correctAnswer}
              revealed={revealed}
              onSelect={handleSelect}
            />
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div
            className="mt-8 flex justify-end gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: selectedAnswer !== null ? 1 : 0.4 }}
          >
            <Button
              onClick={handleFinishQuiz}
              variant="outline"
              disabled={total === 0 || submitting}
              className="h-12 px-6 rounded-full font-bold cursor-pointer"
            >
              <Square className="w-4 h-4 mr-2" />
              Finish Quiz
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                selectedAnswer === null || submitting || loadingQuestion
              }
              className="h-12 px-8 rounded-full font-bold cursor-pointer"
            >
              {submitting || loadingQuestion ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Failed Question Overlay */}
      <AnimatePresence>
        {showFailedOverlay && failedQuestionData && (
          <FailedQuestionOverlay
            question={failedQuestionData.question}
            selectedAnswer={failedQuestionData.selectedAnswer}
            correctAnswer={failedQuestionData.correctAnswer}
            explanation={failedQuestionData.explanation}
            recommendations={failedQuestionData.recommendations}
            onContinue={handleContinueAfterFailed}
          />
        )}
      </AnimatePresence>
    </>
  );
}
