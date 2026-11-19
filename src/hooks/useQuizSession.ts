"use client";

import { useState, useEffect, useCallback } from "react";
import type { QuizSession } from "@/types/quiz";

const SESSION_KEY = "nlwc_quiz_session";

interface StoredSession {
  session_id: string;
  username: string;
}

/**
 * The player's quiz session. All reads and writes go through /api/quiz/*
 * routes (service key on the server); the browser no longer talks to
 * Supabase directly, which is what let the quiz tables' RLS be locked down.
 */

/** Load a session by its id; null when it doesn't exist (or can't be read). */
async function fetchSession(sessionId: string): Promise<QuizSession | null> {
  try {
    const res = await fetch(
      `/api/quiz/session?session_id=${encodeURIComponent(sessionId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as QuizSession;
  } catch {
    return null;
  }
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

  /** Load the stored session (the API also bumps last_active). */
  async function syncSession(sessionId: string) {
    const data = await fetchSession(sessionId);
    if (!data) {
      setNeedsUsername(true);
      setLoading(false);
      return;
    }
    setSession(data);
    setLoading(false);
  }

  const createSession = useCallback(
    async (
      username: string,
      /** Saved with the profile so it can be recovered on another device. */
      security?: { question: string; answer: string },
    ) => {
      const trimmed = username.trim();

      const res = await fetch("/api/quiz/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed, security }),
      });
      const data = (await res
        .json()
        .catch(() => ({}))) as Partial<QuizSession> & {
        error?: string;
        code?: string;
      };

      if (!res.ok || !data.session_id) {
        const error = new Error(
          res.status === 409
            ? "Username already taken"
            : data.error || "Failed to create session",
        ) as Error & { code?: string };
        if (res.status === 409) error.code = "USERNAME_EXISTS";
        throw error;
      }

      const created = data as QuizSession;
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          session_id: created.session_id,
          username: created.username,
        }),
      );
      setSession(created);
      setNeedsUsername(false);
      return created;
    },
    [],
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setNeedsUsername(true);
  }, []);

  // Adopt an existing session recovered via the security question (new device /
  // cleared history): persist it locally and load its progress.
  const adoptSession = useCallback(
    async (sessionId: string, username: string) => {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ session_id: sessionId, username }),
      );
      setLoading(true);
      const data = await fetchSession(sessionId);
      if (data) {
        setSession(data);
        setNeedsUsername(false);
      }
      setLoading(false);
    },
    [],
  );

  // Optimistically flag the in-memory session as secured after the user sets a
  // security question (avoids a refetch just to flip the UI banner).
  const markSecuritySet = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, security_set: true } : prev));
  }, []);

  return {
    session,
    loading,
    needsUsername,
    createSession,
    clearSession,
    adoptSession,
    markSecuritySet,
  };
}
