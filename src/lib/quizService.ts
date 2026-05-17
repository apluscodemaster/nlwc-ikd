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
// sermon_ref on questions can be:
//   - A transcript slug (e.g. "the-power-of-faith") → links to /transcripts/{slug}
//   - A numeric audio sermon ID (e.g. "1234") → links to /sermons/audio/{id}
// The function always tries to provide both audio and transcript links.
export async function getRecommendations(
  weakAreas: WeakArea[],
  sermonRefs: { slug: string; category: string }[] = [],
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // 1. Targeted recommendations from sermon_ref on failed questions
  if (sermonRefs.length > 0) {
    // Deduplicate by slug
    const seen = new Set<string>();
    const uniqueRefs = sermonRefs.filter((r) => {
      if (seen.has(r.slug)) return false;
      seen.add(r.slug);
      return true;
    });

    for (const ref of uniqueRefs) {
      if (recommendations.length >= 6) break;

      const isNumericId = /^\d+$/.test(ref.slug);

      if (isNumericId) {
        // sermon_ref is a numeric audio sermon ID — link directly
        const audioId = parseInt(ref.slug, 10);
        const title = `Audio Message #${audioId}`;

        // Try to get the actual title from WP
        let resolvedTitle = title;
        try {
          const { getAudioSermonDetail } = await import("@/lib/audioSermons");
          const sermon = await getAudioSermonDetail(audioId);
          if (sermon && sermon.title) {
            resolvedTitle = sermon.title;
          }
        } catch {
          // Use fallback title
        }

        recommendations.push({
          category: ref.category as QuizCategory,
          title: resolvedTitle,
          reason: "Listen to this sermon — you missed questions from it",
          listen_url: `/sermons/audio/${audioId}`,
        });
      } else {
        // sermon_ref is a transcript slug — generate transcript link
        // and try to find matching audio
        const title = ref.slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        // Try to find matching audio sermon by searching WP API
        let audioId: number | null = null;
        let audioTitle: string | null = null;
        try {
          const { getAudioSermons } = await import("@/lib/audioSermons");
          const searchResult = await getAudioSermons({
            search: title,
            perPage: 5,
            page: 1,
          });
          if (searchResult.data.length > 0) {
            // Try fuzzy match first
            const match = searchResult.data.find((s) => {
              const sermonTitle = s.title
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, "");
              const refTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, "");
              return (
                sermonTitle.includes(refTitle) ||
                refTitle.includes(sermonTitle) ||
                sermonTitle === refTitle
              );
            });
            // Use fuzzy match, or fall back to first search result
            const foundSermon = match || searchResult.data[0];
            audioId = foundSermon.id;
            audioTitle = foundSermon.title; // Use the actual audio title from search result

            console.debug(
              `[Quiz Recommendations] Found audio match for "${title}": ${audioTitle} (ID: ${audioId})`,
            );
          }
        } catch (error) {
          // Audio search failed silently — transcript link still works
          console.warn("Audio sermon search failed for:", ref.slug, error);
        }

        // Add audio recommendation if found
        if (audioId && audioTitle) {
          recommendations.push({
            category: ref.category as QuizCategory,
            title: audioTitle,
            reason: "Listen to this sermon — you missed questions from it",
            listen_url: `/sermons/audio/${audioId}`,
          });
        }

        // Always add transcript recommendation
        recommendations.push({
          category: ref.category as QuizCategory,
          title,
          reason: "Read this transcript — you missed questions from it",
          read_url: `/transcripts/${ref.slug}`,
        });
      }
    }
  }

  // 2. Category-based fallback: use content_mapping if available
  if (weakAreas.length > 0 && recommendations.length < 6) {
    const coveredSlugs = new Set(
      recommendations
        .filter((r) => r.read_url)
        .map((r) => r.read_url!.replace("/transcripts/", "")),
    );
    const categories = weakAreas.map((w) => w.category);

    try {
      const { data: catContent } = await getSupabase()
        .from("content_mapping")
        .select("*")
        .in("category", categories)
        .order("analyzed_at", { ascending: false })
        .limit(6);

      if (catContent && catContent.length > 0) {
        for (const c of catContent as ContentMapping[]) {
          if (c.slug && coveredSlugs.has(c.slug)) continue;
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
    } catch {
      // content_mapping query failed — skip category fallback
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

  // Get failed questions with explanations
  const failedQuestions: Array<{
    question: QuizQuestion;
    explanation?: string;
  }> = [];
  for (const attempt of attempts) {
    if (!attempt.is_correct) {
      const question = await fetchQuestionById(attempt.question_id);
      if (question) {
        failedQuestions.push({
          question,
          explanation: question.explain,
        });
      }
    }
  }

  const weakAreas = await getWeakAreas(sessionId);
  const recommendations = await getRecommendations(weakAreas, failedSermonRefs);

  return {
    total_questions: total,
    correct_answers: correct,
    score_percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    by_category: byCategory,
    recommendations,
    failed_questions: failedQuestions,
  };
}
