import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
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
  const adminDb = getAdminDb();
  let q: admin.firestore.Query = adminDb.collection("quiz_questions");

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

// ── Get recommendations based on weak areas and specific sermon refs ──
// sermon_ref on questions is always a transcript slug.
// Transcript URL: /transcripts/{slug}
// Sermon audio URL: /sermons/audio/{source_id} (matched via title in content_mapping)
export async function getRecommendations(
  weakAreas: WeakArea[],
  sermonRefs: { slug: string; category: string }[] = [],
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // 1. Targeted recommendations from sermon_ref (transcript slug) on failed questions
  if (sermonRefs.length > 0) {
    // Deduplicate by slug
    const seen = new Set<string>();
    const uniqueRefs = sermonRefs.filter((r) => {
      if (seen.has(r.slug)) return false;
      seen.add(r.slug);
      return true;
    });
    const slugs = uniqueRefs.map((r) => r.slug);

    // Look up transcript entries by slug
    const { data: transcriptContent } = await getSupabase()
      .from("content_mapping")
      .select("*")
      .eq("source_type", "transcript")
      .in("slug", slugs)
      .limit(6);

    const foundSlugs = new Set<string>();

    if (transcriptContent && transcriptContent.length > 0) {
      // Also try to find matching sermon entries by title for audio links
      const titles = (transcriptContent as ContentMapping[]).map((t) => t.title);
      const { data: sermonContent } = await getSupabase()
        .from("content_mapping")
        .select("*")
        .eq("source_type", "sermon")
        .in("title", titles)
        .limit(6);

      const sermonByTitle = new Map(
        (sermonContent || []).map((s: ContentMapping) => [s.title, s]),
      );

      for (const t of transcriptContent as ContentMapping[]) {
        if (t.slug) foundSlugs.add(t.slug);
        const matchingSermon = sermonByTitle.get(t.title);

        // Alternate between transcript and audio recommendations
        const useAudio = matchingSermon && recommendations.length % 2 === 0;

        recommendations.push({
          category: t.category as QuizCategory,
          content: t,
          reason: useAudio
            ? "Listen to this sermon — you missed questions from it"
            : "Read this transcript — you missed questions from it",
          listen_url: useAudio
            ? `/sermons/audio/${matchingSermon.source_id}`
            : undefined,
          read_url: !useAudio ? `/transcripts/${t.slug}` : undefined,
        });
      }
    }

    // Fallback: direct transcript link for refs not found in content_mapping
    for (const ref of uniqueRefs) {
      if (foundSlugs.has(ref.slug)) continue;
      if (recommendations.length >= 6) break;

      const title = ref.slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      recommendations.push({
        category: ref.category as QuizCategory,
        title,
        reason: "Read this transcript — you missed questions from it",
        read_url: `/transcripts/${ref.slug}`,
      });
    }
  }

  // 2. Category-based fallback for weak areas not already covered
  if (weakAreas.length > 0) {
    const coveredSlugs = new Set(recommendations.map((r) => r.content?.slug));
    const categories = weakAreas.map((w) => w.category);

    const { data: catContent } = await getSupabase()
      .from("content_mapping")
      .select("*")
      .in("category", categories)
      .order("analyzed_at", { ascending: false })
      .limit(6);

    if (catContent && catContent.length > 0) {
      for (const c of catContent as ContentMapping[]) {
        if (coveredSlugs.has(c.slug)) continue;
        if (recommendations.length >= 6) break;

        recommendations.push({
          category: c.category as QuizCategory,
          content: c,
          reason: `You missed ${weakAreas.find((w) => w.category === c.category)?.wrong_count || 0} questions in "${c.category}"`,
          listen_url:
            c.source_type === "sermon"
              ? `/sermons/audio/${c.source_id}`
              : undefined,
          read_url:
            c.source_type === "transcript"
              ? `/transcripts/${c.slug}`
              : undefined,
        });
      }
    }
  }

  return recommendations;
}

// ── Build quiz result after submission ──
export async function buildQuizResult(
  sessionId: string,
  attempts: Omit<QuizAttempt, "id" | "answered_at">[],
  failedSermonRefs: { slug: string; category: string }[] = [],
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
  const recommendations = await getRecommendations(weakAreas, failedSermonRefs);

  return {
    total_questions: total,
    correct_answers: correct,
    score_percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    by_category: byCategory,
    recommendations,
  };
}
