"use client";

import React, { useState, useCallback, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import UsernamePrompt from "@/components/quiz/UsernamePrompt";
import QuizLauncher from "@/components/quiz/QuizLauncher";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import QuizResults from "@/components/quiz/QuizResults";
import Leaderboard from "@/components/quiz/Leaderboard";
import SecurityQuestionModal from "@/components/quiz/SecurityQuestionModal";
import { useQuizSession } from "@/hooks/useQuizSession";
import { ShieldCheck } from "lucide-react";
import type { QuizCategory, QuizResult, LeaderboardEntry } from "@/types/quiz";

type Phase = "launch" | "playing" | "results";

export default function QuizPageClient() {
  const {
    session,
    loading,
    needsUsername,
    createSession,
    adoptSession,
    markSecuritySet,
  } = useQuizSession();
  const [phase, setPhase] = useState<Phase>("launch");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [category, setCategory] = useState<QuizCategory | null>(null);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showSecurity, setShowSecurity] = useState(false);
  const [securityMode, setSecurityMode] = useState<"set" | "change">("set");

  // New user just created → prompt (skippable) to set a recovery question.
  const handleCreateSession = useCallback(
    async (username: string) => {
      const created = await createSession(username);
      setSecurityMode("set");
      setShowSecurity(true);
      return created;
    },
    [createSession],
  );

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch("/api/quiz/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch(() => {});
  }, [result]); // re-fetch after results

  const handleStart = useCallback(async (cat: QuizCategory | null) => {
    setFetchingQuestions(true);
    try {
      setCategory(cat);
      // Start quiz directly - questions will be fetched progressively
      setPhase("playing");
    } catch (error) {
      console.error("Failed to start quiz:", error);
    } finally {
      setFetchingQuestions(false);
    }
  }, []);

  const handleComplete = useCallback((r: QuizResult) => {
    setResult(r);
    setPhase("results");
  }, []);

  const handleRetry = useCallback(() => {
    setResult(null);
    setCategory(null);
    setPhase("launch");
  }, []);

  if (loading) {
    return (
      <main>
        <PageHeader
          title="Bible Quiz"
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
        title="Bible Quiz"
        subtitle="Test your knowledge from services and messages. See how you rank on the leaderboard!"
        backgroundImage="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop"
      />

      <SectionContainer>
        <div className="py-8 space-y-12">
          {/* Username prompt for new users */}
          {needsUsername ? (
            <UsernamePrompt
              onSubmit={handleCreateSession}
              onRecovered={(s) => adoptSession(s.session_id, s.username)}
            />
          ) : (
            <>
              {/* Recovery prompt — only when no security question is set yet */}
              {phase === "launch" && session && !session.security_set && (
                <div className="max-w-2xl mx-auto -mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Secure your progress so you can continue on another device
                      or after clearing your browser.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSecurityMode("set");
                      setShowSecurity(true);
                    }}
                    className="shrink-0 px-4 py-2 rounded-full bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Set security question
                  </button>
                </div>
              )}

              {/* Quiz phases */}
              {phase === "launch" && (
                <QuizLauncher
                  onStart={handleStart}
                  loading={fetchingQuestions}
                  username={session?.username}
                />
              )}

              {/* Change recovery question (already secured) */}
              {phase === "launch" && session?.security_set && (
                <p className="max-w-2xl mx-auto -mt-6 text-center text-xs text-muted-foreground">
                  <button
                    onClick={() => {
                      setSecurityMode("change");
                      setShowSecurity(true);
                    }}
                    className="font-medium text-primary hover:underline cursor-pointer"
                  >
                    Change your recovery question
                  </button>
                </p>
              )}

              {phase === "playing" && session && (
                <QuizPlayer
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

      {showSecurity && session && (
        <SecurityQuestionModal
          sessionId={session.session_id}
          mode={securityMode}
          onClose={() => setShowSecurity(false)}
          onSaved={markSecuritySet}
        />
      )}
    </main>
  );
}
