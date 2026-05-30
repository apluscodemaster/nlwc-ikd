import type { QuizCategory } from "@/types/quiz";

export interface AdminStats {
  totalPlayers: number;
  totalQuizzesTaken: number;
  totalAttempts: number;
  totalCorrect: number;
  avgScore: number;
  categoryStats: Record<string, { total: number; correct: number }>;
  recentSessions: {
    session_id: string;
    username: string;
    total_score: number;
    quizzes_taken: number;
    last_active: string;
    created_at: string;
  }[];
}

export type ActiveTab = "questions" | "stats" | "players" | "categories";
export type ModalMode = "create" | "edit" | null;

export const DEFAULT_CATEGORIES: QuizCategory[] = [
  "Sunday Message",
  "Sunday School",
  "Bible Study",
  "Special Meeting",
  "Season of the Spirit",
];
