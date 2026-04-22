import { getAdminDb } from "@/lib/firebase-admin";
import { getSupabase } from "@/lib/supabase";
import type { FirebaseFirestore } from "firebase-admin";
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
  const adminDb = getAdminDb();
  let q: FirebaseFirestore.Query = adminDb.collection("quiz_questions");

  if (category) {
    q = q.where("category", "==", category);
  }
  q = q.limit(count);

  const snapshot = await q.get();

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
  const adminDb = getAdminDb();
  const ref = adminDb.collection("quiz_questions").doc(questionId);
  const snap = await ref.get();
  if (!snap.exists) return null;
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
