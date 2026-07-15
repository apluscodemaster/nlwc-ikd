/**
 * Quiz Mastery & Streak Utilities
 *
 * Handles streak calculation, mastery % computation,
 * and localStorage persistence for review tracking.
 */

const STORAGE_KEY = "nlwc_quiz_mastery";

export interface MasteryState {
  review_streak: number;
  last_review_date: string | null; // ISO date string (YYYY-MM-DD)
  num_correct_reviews: number;
  reviewed_question_ids: string[];
}

const DEFAULT_STATE: MasteryState = {
  review_streak: 0,
  last_review_date: null,
  num_correct_reviews: 0,
  reviewed_question_ids: [],
};

/** Get today's date as YYYY-MM-DD in local timezone */
function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Get yesterday's date as YYYY-MM-DD in local timezone */
function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Load mastery state from localStorage */
export function loadMasteryState(): MasteryState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as MasteryState;
    // Validate and apply streak reset if needed
    return applyStreakDecay(parsed);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/** Save mastery state to localStorage */
export function saveMasteryState(state: MasteryState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Apply streak decay: if last_review_date is not today or yesterday,
 * reset streak to 0.
 */
function applyStreakDecay(state: MasteryState): MasteryState {
  if (!state.last_review_date) return state;
  const today = getToday();
  const yesterday = getYesterday();

  if (
    state.last_review_date !== today &&
    state.last_review_date !== yesterday
  ) {
    return { ...state, review_streak: 0 };
  }
  return state;
}

/**
 * Record a review for a correctly-answered question.
 * - Increments num_correct_reviews only once per question_id.
 * - Updates streak: +1 if first review of the day, maintains if already reviewed today.
 * - Returns the updated state.
 */
export function recordCorrectReview(
  state: MasteryState,
  questionId: string,
): MasteryState {
  const today = getToday();
  const yesterday = getYesterday();
  const alreadyReviewed = state.reviewed_question_ids.includes(questionId);

  let newReviewCount = state.num_correct_reviews;
  const newReviewedIds = [...state.reviewed_question_ids];

  if (!alreadyReviewed) {
    newReviewCount += 1;
    newReviewedIds.push(questionId);
  }

  // Calculate streak
  let newStreak = state.review_streak;
  if (state.last_review_date === today) {
    // Already reviewed today — streak stays the same
  } else if (
    state.last_review_date === yesterday ||
    state.last_review_date === null
  ) {
    // Consecutive day or first-ever review
    newStreak += 1;
  } else {
    // Streak broken — restart at 1
    newStreak = 1;
  }

  const updated: MasteryState = {
    review_streak: newStreak,
    last_review_date: today,
    num_correct_reviews: newReviewCount,
    reviewed_question_ids: newReviewedIds,
  };

  saveMasteryState(updated);
  return updated;
}

/**
 * Compute mastery percentage.
 * mastery_percent = (num_correct_reviews / total_correct_answers) * 100
 */
export function computeMasteryPercent(
  numCorrectReviews: number,
  totalCorrectAnswers: number,
): number {
  if (totalCorrectAnswers <= 0) return 0;
  return Math.min(
    100,
    Math.round((numCorrectReviews / totalCorrectAnswers) * 100),
  );
}
