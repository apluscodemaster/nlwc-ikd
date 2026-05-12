"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { QuizSession } from "@/types/quiz";

const SESSION_KEY = "nlwc_quiz_session";

interface StoredSession {
  session_id: string;
  username: string;
}

export function useQuizSession() {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const parsed: StoredSession = JSON.parse(stored);
        syncSession(parsed.session_id);
      } catch {
        setNeedsUsername(true);
        setLoading(false);
      }
    } else {
      setNeedsUsername(true);
      setLoading(false);
    }
  }, []);

  async function syncSession(sessionId: string) {
    const { data, error } = await getSupabase()
      .from("sessions")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (error || !data) {
      setNeedsUsername(true);
      setLoading(false);
      return;
    }

    // Update last_active silently
    getSupabase()
      .from("sessions")
      .update({ last_active: new Date().toISOString() })
      .eq("session_id", sessionId)
      .then();

    setSession(data as QuizSession);
    setLoading(false);
  }

  const createSession = useCallback(async (username: string) => {
    const trimmed = username.trim();

    // Check if username already exists (case-insensitive)
    const { data: existingSession, error: checkError } = await getSupabase()
      .from("sessions")
      .select("username")
      .ilike("username", trimmed)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      throw new Error("Failed to validate username");
    }

    if (existingSession) {
      const error = new Error("Username already taken") as Error & {
        code?: string;
      };
      error.code = "USERNAME_EXISTS";
      throw error;
    }

    const sessionId = crypto.randomUUID();

    const { data, error } = await getSupabase()
      .from("sessions")
      .insert({ session_id: sessionId, username: trimmed })
      .select()
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        // Unique constraint violation
        const constraintError = new Error(
          "Username already taken",
        ) as Error & { code?: string };
        constraintError.code = "USERNAME_EXISTS";
        throw constraintError;
      }
      throw new Error("Failed to create session");
    }

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ session_id: sessionId, username: trimmed }),
    );

    setSession(data as QuizSession);
    setNeedsUsername(false);
    return data as QuizSession;
  }, []);

  const updateScore = useCallback(
    async (additionalScore: number) => {
      if (!session) return;

      const { data } = await getSupabase()
        .from("sessions")
        .update({
          total_score: session.total_score + additionalScore,
          quizzes_taken: session.quizzes_taken + 1,
          last_active: new Date().toISOString(),
        })
        .eq("session_id", session.session_id)
        .select()
        .single();

      if (data) setSession(data as QuizSession);
    },
    [session],
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setNeedsUsername(true);
  }, []);

  return {
    session,
    loading,
    needsUsername,
    createSession,
    updateScore,
    clearSession,
  };
}
