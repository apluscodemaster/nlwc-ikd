/**
 * Quiz identity (port of the web's useQuizSession). The anonymous session_id
 * is the player's only credential, so it lives in SecureStore rather than
 * plain storage (docs/ARCHITECTURE.md §7.3).
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { quizApi } from "~/api/quiz";
import { secure } from "~/lib/storage";
import type { QuizSession } from "~/shared";

const SESSION_KEY = "nlwc_quiz_session";

interface Ctx {
  session: QuizSession | null;
  loading: boolean;
  createSession: (username: string) => Promise<QuizSession>;
  adoptSession: (sessionId: string, username: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearSession: () => Promise<void>;
  markSecuritySet: () => void;
}

const QuizSessionContext = createContext<Ctx | null>(null);

export function QuizSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await secure.get(SESSION_KEY);
      const stored = raw ? (JSON.parse(raw) as { session_id: string }) : null;
      setSession(stored ? await quizApi.session(stored.session_id) : null);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = (id: string, username: string) =>
    secure.set(SESSION_KEY, JSON.stringify({ session_id: id, username }));

  const createSession = useCallback(async (username: string) => {
    const created = await quizApi.createSession(username);
    await persist(created.session_id, created.username);
    setSession(created);
    return created;
  }, []);

  const adoptSession = useCallback(
    async (sessionId: string, username: string) => {
      await persist(sessionId, username);
      setLoading(true);
      await load();
    },
    [load],
  );

  const clearSession = useCallback(async () => {
    await secure.remove(SESSION_KEY);
    setSession(null);
  }, []);

  const markSecuritySet = useCallback(() => setSession((s) => (s ? { ...s, security_set: true } : s)), []);

  return (
    <QuizSessionContext.Provider
      value={{ session, loading, createSession, adoptSession, refresh: load, clearSession, markSecuritySet }}
    >
      {children}
    </QuizSessionContext.Provider>
  );
}

export function useQuizSession(): Ctx {
  const ctx = useContext(QuizSessionContext);
  if (!ctx) throw new Error("useQuizSession must be used inside <QuizSessionProvider>");
  return ctx;
}
