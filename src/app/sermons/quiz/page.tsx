"use client";

import React, { useState, useCallback, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import UsernamePrompt from "@/components/quiz/UsernamePrompt";
import QuizLauncher from "@/components/quiz/QuizLauncher";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import QuizResults from "@/components/quiz/QuizResults";
import Leaderboard from "@/components/quiz/Leaderboard";
import { useQuizSession } from "@/hooks/useQuizSession";
import type {
  QuizCategory,
  QuizQuestion,
  QuizResult,
  LeaderboardEntry,
} from "@/types/quiz";

type Phase = "launch" | "playing" | "results";

export default function QuizPage() {
  const { session, loading, needsUsername, createSession } = useQuizSession();
  const [phase, setPhase] = useState<Phase>("launch");
  const [questions, setQuestions] = useState<
    Omit<QuizQuestion, "correctAnswer">[]
  >([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [category, setCategory] = useState<QuizCategory | null>(null);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch("/api/quiz/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch(() => {});
  }, [result]); // re-fetch after results

  const handleStart = useCallback(
    async (cat: QuizCategory | null, count: number) => {
      setFetchingQuestions(true);
      try {
        const params = new URLSearchParams({ count: String(count) });
        if (cat) params.set("category", cat);

        const res = await fetch(`/api/quiz/questions?${params}`);
        if (!res.ok) throw new Error("Failed to fetch questions");

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No questions available");
        }

        setQuestions(data);
        setCategory(cat);
        setPhase("playing");
      } catch (error) {
        console.error("Failed to load questions:", error);
      } finally {
        setFetchingQuestions(false);
      }
    },
    [],
  );

  const handleComplete = useCallback((r: QuizResult) => {
    setResult(r);
    setPhase("results");
  }, []);

  const handleRetry = useCallback(() => {
    setResult(null);
    setQuestions([]);
    setPhase("launch");
  }, []);

  if (loading) {
    return (
      <main>
        <PageHeader
          title="Church Quiz"
          subtitle="Test your knowledge from services and messages"
        />
        <SectionContainer>
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </SectionContainer>
      </main>
    );
  }

  return (
    <main>
      <PageHeader
        title="Church Quiz"
        subtitle="Test your knowledge from services and messages. See how you rank on the leaderboard!"
        backgroundImage="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop"
      />

      <SectionContainer>
        <div className="py-8 space-y-12">
          {/* Username prompt for new users */}
          {needsUsername ? (
            <UsernamePrompt onSubmit={createSession} />
          ) : (
            <>
              {/* Quiz phases */}
              {phase === "launch" && (
                <QuizLauncher
                  onStart={handleStart}
                  loading={fetchingQuestions}
                />
              )}

              {phase === "playing" && session && (
                <QuizPlayer
                  questions={questions}
                  sessionId={session.session_id}
                  category={category}
                  onComplete={handleComplete}
                />
              )}

              {phase === "results" && result && (
                <QuizResults result={result} onRetry={handleRetry} />
              )}

              {/* Leaderboard (always visible except during play) */}
              {phase !== "playing" && (
                <Leaderboard
                  entries={leaderboard}
                  currentSessionId={session?.session_id}
                />
              )}
            </>
          )}
        </div>
      </SectionContainer>
    </main>
  );
}
