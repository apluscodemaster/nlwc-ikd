// ── Quiz Categories ──
export type QuizCategory = string;

export const QUIZ_CATEGORIES: QuizCategory[] = [
  "Sunday Message",
  "Sunday School",
  "Bible Study",
  "Special Meeting",
  "Season of the Spirit",
];

// ── Session ──
export interface QuizSession {
  id: string;
  session_id: string;
  username: string;
  created_at: string;
  last_active: string;
  total_score: number;
  quizzes_taken: number;
  /** Whether a recovery security question has been configured for this session. */
  security_set?: boolean;
}

// ── Firebase Question (read-only from Firestore) ──
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index into options[]
  category: QuizCategory;
  sermon_ref?: string; // optional link to sermon/transcript slug
  explain?: string; // explanation displayed after quiz completion
}

// ── Quiz Attempt (saved to Supabase) ──
export interface QuizAttempt {
  id: string;
  session_id: string;
  question_id: string;
  category: QuizCategory;
  is_correct: boolean;
  answered_at: string;
}

// ── Content Mapping (Supabase bridge to WP content) ──
export interface ContentMapping {
  id: string;
  source_type: "sermon" | "transcript";
  source_id: number;
  title: string;
  slug: string | null;
  category: QuizCategory;
  keywords: string[];
  speaker: string | null;
  wp_category_id: number | null;
  analyzed_at: string;
  updated_at: string;
}

// ── Leaderboard ──
export interface LeaderboardEntry {
  session_id: string;
  username: string;
  total_score: number;
  quizzes_taken: number;
  last_active: string;
}

// ── Weak Area ──
export interface WeakArea {
  category: QuizCategory;
  wrong_count: number;
  total_count: number;
  fail_rate: number;
}

// ── Recommendation ──
export interface Recommendation {
  category: QuizCategory;
  content?: ContentMapping;
  title?: string;
  reason: string;
  listen_url?: string;
  read_url?: string;
}

// ── Failed Question with Recommendations ──
export interface FailedQuestionState {
  question: QuizQuestion;
  selectedAnswer: number;
  correctAnswer: number;
  recommendations: Recommendation[];
  explanation?: string;
}

// ── Quiz Result (returned after submitting a quiz) ──
export interface QuizResult {
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  by_category: Partial<
    Record<QuizCategory, { correct: number; total: number }>
  >;
  recommendations: Recommendation[];
  failed_questions?: Array<{
    question: QuizQuestion;
    explanation?: string;
  }>;
}

// ── Answered question record (used for per-question tracking in QuizPlayer) ──
export interface AnsweredQuestion {
  question: QuizQuestion;
  selectedAnswer: number;
  correctAnswer: number;
  is_correct: boolean;
  explanation?: string;
  time_to_answer_ms: number;
  recommendations: Recommendation[];
}

// ── Analytics event types ──
export type QuizAnalyticsEvent =
  | {
      type: "review_started";
      question_id: string;
      source: "post_answer_chip" | "mastery_review";
    }
  | {
      type: "smart_nudge_shown";
      question_id: string;
      time_to_answer_ms: number;
    }
  | {
      type: "mastery_review_completed";
      num_reviewed: number;
      num_skipped: number;
    };
