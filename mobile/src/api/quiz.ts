import type { LeaderboardEntry, QuizQuestion, QuizResult, QuizSession, Recommendation } from "~/shared";
import { ApiError, api } from "./client";

/** Question as served to players: the correct answer is stripped server-side. */
export type PublicQuestion = Omit<QuizQuestion, "correctAnswer">;

export interface SaveAnswerResult {
  is_correct: boolean;
  correct_answer: number;
  explanation: string | null;
}

export const quizApi = {
  session: async (sessionId: string): Promise<QuizSession | null> => {
    try {
      return await api.get<QuizSession>("/api/quiz/session", { session_id: sessionId });
    } catch (e) {
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) return null;
      throw e;
    }
  },

  /** 409 → the username is taken (`ApiError.status === 409`). */
  createSession: (username: string, security?: { question: string; answer: string }) =>
    api.post<QuizSession>("/api/quiz/session", { username: username.trim(), security }),

  /** Next question(s); the server excludes everything this session has answered. */
  questions: (sessionId: string, opts: { category?: string; exclude?: string[]; count?: number } = {}) =>
    api.get<PublicQuestion[]>("/api/quiz/questions", {
      session_id: sessionId,
      count: opts.count ?? 1,
      category: opts.category,
      exclude: opts.exclude?.length ? opts.exclude.slice(-25).join(",") : undefined,
    }),

  saveAnswer: (sessionId: string, q: PublicQuestion, selected: number) =>
    api.post<SaveAnswerResult>("/api/quiz/save-answer", {
      session_id: sessionId,
      answer: { question_id: q.id, category: q.category, selected_answer: selected },
    }),

  recommendations: async (category: string, sermonRef?: string): Promise<Recommendation[]> => {
    try {
      return await api.get<Recommendation[]>("/api/quiz/recommendations", { category, sermon_ref: sermonRef });
    } catch {
      return [];
    }
  },

  /**
   * Slow by design: the server looks up every missed question and searches
   * WordPress for matching messages one by one, which can take well over the
   * default 15 s for players with many misses.
   */
  progress: (sessionId: string, signal?: AbortSignal) =>
    api.get<QuizResult>("/api/quiz/progress", { session_id: sessionId }, signal, 90_000),

  leaderboard: () => api.get<LeaderboardEntry[]>("/api/quiz/leaderboard"),

  /** Step 1 of recovery: what credential does this username need? */
  recoverLookup: (username: string) =>
    api.get<{ question: string | null; hasCode?: boolean }>("/api/quiz/recover", { username: username.trim() }),

  /** Step 2: security answer or admin-issued code → the session to adopt. */
  recover: (username: string, credential: { answer: string } | { code: string }) =>
    api.post<{ session_id: string; username: string }>("/api/quiz/recover", {
      username: username.trim(),
      ...credential,
    }),

  setSecurity: (sessionId: string, question: string, answer: string) =>
    api.post<{ success: true }>("/api/quiz/security", { session_id: sessionId, question, answer }),
};
