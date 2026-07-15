"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, RefreshCw, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuestionCard from "./QuestionCard";
import QuizProgressBar from "./QuizProgressBar";
import FailedQuestionOverlay from "./FailedQuestionOverlay";
import ReviewExplanationOverlay from "./ReviewExplanationOverlay";
import PostAnswerChip from "./PostAnswerChip";
import MasteryReviewScreen from "./MasteryReviewScreen";
import StreakBadge from "./StreakBadge";
import MasteryProgressBar from "./MasteryProgressBar";
import type {
  QuizQuestion,
  QuizResult,
  QuizCategory,
  Recommendation,
  AnsweredQuestion,
  QuizAnalyticsEvent,
} from "@/types/quiz";
import {
  loadMasteryState,
  saveMasteryState,
  recordCorrectReview,
  computeMasteryPercent,
  type MasteryState,
} from "@/lib/quizMastery";

const MASTERY_BATCH_SIZE = 5;

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

/** Fire-and-forget analytics event (non-blocking) */
function trackEvent(event: QuizAnalyticsEvent) {
  try {
    if (typeof window !== "undefined" && "gtag" in window) {
      const gtag = (
        window as unknown as {
          gtag: (
            command: "event",
            eventName: string,
            params?: Record<string, unknown>,
          ) => void;
        }
      ).gtag;
      gtag("event", event.type, event);
    }
  } catch {
    // analytics should never block quiz flow
  }
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

  // ── New mastery/streak/chip state ──
  const [showPostAnswerChip, setShowPostAnswerChip] = useState(false);
  const [chipQuestionData, setChipQuestionData] =
    useState<AnsweredQuestion | null>(null);
  const [showReviewOverlay, setShowReviewOverlay] = useState(false);
  const [showMasteryReview, setShowMasteryReview] = useState(false);
  const [batchQuestions, setBatchQuestions] = useState<AnsweredQuestion[]>([]);
  const [masteryState, setMasteryState] =
    useState<MasteryState>(loadMasteryState);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Mutable ref is the SINGLE SOURCE OF TRUTH for answered IDs.
  // Updated synchronously before fetching next question to prevent repeats.
  const answeredIdsRef = useRef<Set<string>>(new Set());

  const initializedRef = useRef(false);

  // Fetch a new question — excludes all IDs currently in the ref
  const fetchNextQuestion = useCallback(async () => {
    setLoadingQuestion(true);
    setNoMoreQuestions(false);
    try {
      const params = new URLSearchParams({
        count: "1",
        session_id: sessionId,
      });
      if (category) params.set("category", category);

      // The server excludes every question this session has answered (read from
      // the DB via session_id). We additionally pass only the most recent IDs —
      // enough to cover an answer that may not be persisted yet — so the URL
      // stays short no matter how many questions the player has answered. (The
      // old code sent the entire answered set, which both capped reachable
      // questions and risked exceeding request-length limits.)
      if (answeredIdsRef.current.size > 0) {
        const recent = Array.from(answeredIdsRef.current).slice(-25);
        params.set("exclude", recent.join(","));
      }

      const res = await fetch(`/api/quiz/questions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch question");

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setNoMoreQuestions(true);
        setCurrent(null);
        return false;
      }

      setCurrent(data[0]);
      setSelectedAnswer(null);
      setCorrectAnswer(undefined);
      setRevealed(false);
      questionStartTimeRef.current = Date.now();
      return true;
    } catch (error) {
      console.error("Failed to load question:", error);
      setNoMoreQuestions(true);
      setCurrent(null);
      return false;
    } finally {
      setLoadingQuestion(false);
    }
  }, [category, sessionId]);

  // "No more questions" is not necessarily permanent — an admin may add more to
  // the category. Let the player re-check without leaving the quiz, and auto-check
  // when they return to the tab.
  const [checkingForNew, setCheckingForNew] = useState(false);
  const [noNewFound, setNoNewFound] = useState(false);

  const handleCheckForNew = useCallback(async () => {
    setCheckingForNew(true);
    setNoNewFound(false);
    const found = await fetchNextQuestion();
    setCheckingForNew(false);
    if (!found) setNoNewFound(true);
  }, [fetchNextQuestion]);

  // While parked on the "no more questions" screen, auto re-check when the
  // player returns to the tab (they may have been told to wait for new ones).
  useEffect(() => {
    if (!noMoreQuestions || current || checkingForNew) return;
    const recheck = () => {
      if (document.visibilityState === "visible") handleCheckForNew();
    };
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, [noMoreQuestions, current, checkingForNew, handleCheckForNew]);

  // Seed answeredIdsRef with previously-answered questions, then load first question
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;

      // Fetch IDs the user has already answered in previous quiz runs
      const seedAndStart = async () => {
        try {
          const params = new URLSearchParams({ session_id: sessionId });
          if (category) params.set("category", category);
          const res = await fetch(`/api/quiz/answered-ids?${params}`);
          if (res.ok) {
            const ids: string[] = await res.json();
            if (ids.length > 0) {
              answeredIdsRef.current = new Set(ids);
            }
          }
        } catch {
          // Non-critical: if we can't fetch previous IDs, continue with empty set
        }
        fetchNextQuestion();
      };

      seedAndStart();
    }
  }, [fetchNextQuestion, sessionId, category]);


  const handleSelect = useCallback((index: number) => {
    setSelectedAnswer(index);
  }, []);

  // Fetch recommendations for a failed question
  const fetchRecommendations = useCallback(
    async (
      sermonRef?: string,
      questionCategory?: string,
    ): Promise<Recommendation[]> => {
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
    const timeToAnswer = Date.now() - questionStartTimeRef.current;

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

      // Build full question for batch tracking
      const fullQuestion: QuizQuestion = {
        ...current,
        correctAnswer: correct_answer,
      };

      // Fetch recommendations (used for both correct and incorrect)
      const recs = await fetchRecommendations(
        current.sermon_ref,
        current.category,
      );

      const answeredRecord: AnsweredQuestion = {
        question: fullQuestion,
        selectedAnswer,
        correctAnswer: correct_answer,
        is_correct,
        explanation,
        time_to_answer_ms: timeToAnswer,
        recommendations: recs,
      };

      // Add to batch for mastery review tracking
      const newBatch = [...batchQuestions, answeredRecord];
      setBatchQuestions(newBatch);

      if (is_correct) {
        // Correct answer - increment and prepare chip
        setCorrect((prev) => prev + 1);
        setTotal((prev) => prev + 1);
        setRevealed(false);
        setSelectedAnswer(null);

        // Check if we should show mastery review (every MASTERY_BATCH_SIZE questions)
        if (newBatch.length >= MASTERY_BATCH_SIZE) {
          const correctInBatch = newBatch.filter((q) => q.is_correct);
          if (correctInBatch.length > 0) {
            setShowMasteryReview(true);
            return; // Don't advance yet — mastery review screen will handle it
          }
          setBatchQuestions([]);
        }

        // Smart nudge detection
        const isSlow = timeToAnswer > 8000;
        if (isSlow) {
          trackEvent({
            type: "smart_nudge_shown",
            question_id: current.id,
            time_to_answer_ms: timeToAnswer,
          });
        }

        // Show chip and fetch next question in parallel
        setChipQuestionData(answeredRecord);
        setShowPostAnswerChip(true);
        await fetchNextQuestion();
      } else {
        // Wrong answer - show failed overlay (UNCHANGED)
        setTotal((prev) => prev + 1);
        setCorrectAnswer(correct_answer);
        setRevealed(true);

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
    batchQuestions,
  ]);

  const handleContinueAfterFailed = useCallback(async () => {
    setShowFailedOverlay(false);
    setFailedQuestionData(null);
    setSelectedAnswer(null);
    setCorrectAnswer(undefined);

    // Check if batch is full after failed question
    if (batchQuestions.length >= MASTERY_BATCH_SIZE) {
      const correctInBatch = batchQuestions.filter((q) => q.is_correct);
      if (correctInBatch.length > 0) {
        setShowMasteryReview(true);
        return;
      }
      setBatchQuestions([]);
    }

    await fetchNextQuestion();
  }, [fetchNextQuestion, batchQuestions]);

  // ── Chip tap: open review overlay ──
  const handleChipTap = useCallback(() => {
    if (!chipQuestionData) return;
    setShowPostAnswerChip(false);
    setShowReviewOverlay(true);
    trackEvent({
      type: "review_started",
      question_id: chipQuestionData.question.id,
      source: "post_answer_chip",
    });
  }, [chipQuestionData]);

  const handleChipDismiss = useCallback(() => {
    setShowPostAnswerChip(false);
  }, []);

  // ── Review overlay audio played ──
  const handleReviewAudioPlayed = useCallback(
    (questionId?: string) => {
      const qId = questionId || chipQuestionData?.question.id;
      if (!qId) return;
      const updated = recordCorrectReview(masteryState, qId);
      setMasteryState(updated);
    },
    [chipQuestionData, masteryState],
  );

  const handleReviewOverlayClose = useCallback(() => {
    setShowReviewOverlay(false);
    setChipQuestionData(null);
  }, []);

  // ── Mastery review screen complete ──
  const handleMasteryReviewComplete = useCallback(
    async (numReviewed: number, numSkipped: number) => {
      trackEvent({
        type: "mastery_review_completed",
        num_reviewed: numReviewed,
        num_skipped: numSkipped,
      });
      setShowMasteryReview(false);
      setBatchQuestions([]);
      await fetchNextQuestion();
    },
    [fetchNextQuestion],
  );

  // ── Mastery review audio played ──
  const handleMasteryAudioPlayed = useCallback(
    (questionId: string) => {
      const updated = recordCorrectReview(masteryState, questionId);
      setMasteryState(updated);
      trackEvent({
        type: "review_started",
        question_id: questionId,
        source: "mastery_review",
      });
    },
    [masteryState],
  );

  // Compute mastery %
  const masteryPercent = computeMasteryPercent(
    masteryState.num_correct_reviews,
    correct,
  );

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
            {noNewFound && (
              <p className="text-sm text-gray-400">
                No new questions yet — check back later.
              </p>
            )}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleCheckForNew}
                disabled={checkingForNew || submitting}
                className="h-12 px-6 rounded-full font-bold cursor-pointer gap-2"
              >
                {checkingForNew ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Check for new questions
              </Button>
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

  // ── Mastery Review Screen (after every MASTERY_BATCH_SIZE questions) ──
  if (showMasteryReview) {
    const correctInBatch = batchQuestions.filter((q) => q.is_correct);
    return (
      <MasteryReviewScreen
        correctQuestions={correctInBatch}
        batchSize={MASTERY_BATCH_SIZE}
        onComplete={handleMasteryReviewComplete}
        onAudioPlayed={handleMasteryAudioPlayed}
      />
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Streak Badge & Mastery Progress */}
        <div className="space-y-3">
          <StreakBadge streak={masteryState.review_streak} />
          {correct > 0 && (
            <MasteryProgressBar masteryPercent={masteryPercent} />
          )}
        </div>

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

      {/* Post-answer chip for correct answers */}
      <AnimatePresence>
        {showPostAnswerChip && chipQuestionData && (
          <PostAnswerChip
            isSlow={chipQuestionData.time_to_answer_ms > 8000}
            onTap={handleChipTap}
            onDismiss={handleChipDismiss}
          />
        )}
      </AnimatePresence>

      {/* Review overlay for correct-answer deep-dive */}
      <AnimatePresence>
        {showReviewOverlay && chipQuestionData && (
          <ReviewExplanationOverlay
            question={chipQuestionData.question}
            explanation={chipQuestionData.explanation}
            recommendations={chipQuestionData.recommendations}
            onClose={handleReviewOverlayClose}
            onAudioPlayed={() =>
              handleReviewAudioPlayed(chipQuestionData.question.id)
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}
