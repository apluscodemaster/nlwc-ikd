import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { getSupabase } from "@/lib/supabase";
import type {
  QuizQuestion,
  QuizAttempt,
  QuizCategory,
  WeakArea,
  QuizResult,
  Recommendation,
  ContentMapping,
} from "@/types/quiz";

// ── Fetch questions from Firebase ──
export async function fetchQuizQuestions(
  category?: QuizCategory,
  count: number = 10,
): Promise<QuizQuestion[]> {
  const ref = collection(db, "quiz_questions");
  const constraints = [];

  if (category) {
    constraints.push(where("category", "==", category));
  }
  constraints.push(limit(count));

  const q = query(ref, ...constraints);
  const snapshot = await getDocs(q);

  const questions: QuizQuestion[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<QuizQuestion, "id">),
  }));

  // Shuffle
  return questions.sort(() => Math.random() - 0.5);
}

// ── Fetch a single question (for server-side answer verification) ──
export async function fetchQuestionById(
  questionId: string,
): Promise<QuizQuestion | null> {
  const ref = doc(db, "quiz_questions", questionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<QuizQuestion, "id">) };
}

// ── Save quiz attempts to Supabase ──
export async function saveQuizAttempts(
  sessionId: string,
  attempts: Omit<QuizAttempt, "id" | "answered_at">[],
): Promise<void> {
  const { error } = await getSupabase()
    .from("quiz_attempts")
    .insert(
      attempts.map((a) => ({
        session_id: sessionId,
        question_id: a.question_id,
        category: a.category,
        is_correct: a.is_correct,
      })),
    );

  if (error) throw new Error("Failed to save quiz attempts");
}

// ── Get weak areas for a session ──
export async function getWeakAreas(sessionId: string): Promise<WeakArea[]> {
  const { data, error } = await getSupabase()
    .from("session_weak_areas")
    .select("*")
    .eq("session_id", sessionId);

  if (error || !data) return [];
  return (data as WeakArea[]).filter((w) => w.fail_rate > 40);
}

// ── Get recommendations based on weak areas ──
export async function getRecommendations(
  weakAreas: WeakArea[],
): Promise<Recommendation[]> {
  if (weakAreas.length === 0) return [];

  const categories = weakAreas.map((w) => w.category);

  const { data: content } = await getSupabase()
    .from("content_mapping")
    .select("*")
    .in("category", categories)
    .order("analyzed_at", { ascending: false })
    .limit(6);

  if (!content || content.length === 0) return [];

  return (content as ContentMapping[]).map((c) => ({
    category: c.category,
    content: c,
    reason: `You missed ${weakAreas.find((w) => w.category === c.category)?.wrong_count || 0} questions in "${c.category}"`,
    listen_url: c.source_type === "sermon" ? `/sermons/${c.slug}` : undefined,
    read_url:
      c.source_type === "transcript" ? `/transcripts/${c.slug}` : undefined,
  }));
}

// ── Build quiz result after submission ──
export async function buildQuizResult(
  sessionId: string,
  attempts: Omit<QuizAttempt, "id" | "answered_at">[],
): Promise<QuizResult> {
  await saveQuizAttempts(sessionId, attempts);

  const correct = attempts.filter((a) => a.is_correct).length;
  const total = attempts.length;

  const byCategory: QuizResult["by_category"] = {};
  for (const a of attempts) {
    if (!byCategory[a.category]) {
      byCategory[a.category] = { correct: 0, total: 0 };
    }
    byCategory[a.category]!.total++;
    if (a.is_correct) byCategory[a.category]!.correct++;
  }

  const weakAreas = await getWeakAreas(sessionId);
  const recommendations = await getRecommendations(weakAreas);

  return {
    total_questions: total,
    correct_answers: correct,
    score_percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    by_category: byCategory,
    recommendations,
  };
}
