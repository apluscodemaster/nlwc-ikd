import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAudioSermonDetail, getAudioSermons } from "@/lib/audioSermons";
import { getTranscriptBySlug } from "@/lib/wordpress";
import {
  matchSermonTitle,
  plainTitle,
  titleFromSlug,
  titleKey,
} from "@/lib/sermonMatch";
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
  excludeIds: string[] = [],
): Promise<QuizQuestion[]> {
  const adminDb = getAdminDb();
  let q: admin.firestore.Query = adminDb.collection("quiz_questions");

  if (category) {
    q = q.where("category", "==", category);
  }

  // Firestore has no efficient "NOT IN" for large sets, so we over-fetch and
  // filter the excluded (already-answered) IDs in memory. The window must be
  // large enough that at least `count` UNanswered questions survive the filter:
  // fetchLimit = excludeIds.length + count guarantees this (removing up to
  // excludeIds.length docs from the window still leaves ≥ count), and because
  // the window grows with the exclude set, EVERY question in the collection
  // eventually becomes reachable.
  //
  // The previous fixed limit of 100 meant only the first 100 documents (by
  // document ID) were ever candidates — so once a user had answered those, they
  // were wrongly told they'd exhausted the category, even with hundreds/thousands
  // of unanswered questions remaining (and the "All" choice capped at 100 total).
  const BUFFER = 25; // extra unanswered candidates so the shuffle has variety
  const fetchLimit =
    excludeIds.length > 0 ? excludeIds.length + count + BUFFER : count;
  q = q.limit(fetchLimit);

  const snapshot = await q.get();

  const excludeSet = new Set(excludeIds);
  const questions: QuizQuestion[] = snapshot.docs
    .filter((d) => !excludeSet.has(d.id))
    .map((d) => ({
      id: d.id,
      ...(d.data() as Omit<QuizQuestion, "id">),
    }));

  // Shuffle and return only the requested count
  return questions.sort(() => Math.random() - 0.5).slice(0, count);
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

/**
 * Many questions in one Firestore round-trip (getAll), in the order given;
 * missing ids are skipped. Results pages used to read each failed question
 * separately, which took tens of seconds for a long-time player.
 */
export async function fetchQuestionsByIds(
  questionIds: string[],
): Promise<QuizQuestion[]> {
  const ids = Array.from(new Set(questionIds));
  if (ids.length === 0) return [];
  const adminDb = getAdminDb();
  const col = adminDb.collection("quiz_questions");
  const CHUNK = 300;
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK)
    chunks.push(ids.slice(i, i + CHUNK));
  const snaps = (
    await Promise.all(
      chunks.map((c) => adminDb.getAll(...c.map((id) => col.doc(id)))),
    )
  ).flat();
  const byId = new Map<string, QuizQuestion>();
  for (const snap of snaps) {
    if (snap.exists)
      byId.set(snap.id, {
        id: snap.id,
        ...(snap.data() as Omit<QuizQuestion, "id">),
      });
  }
  return questionIds
    .map((id) => byId.get(id))
    .filter((q): q is QuizQuestion => !!q);
}

// ── Save quiz attempts to Supabase ──
export async function saveQuizAttempts(
  sessionId: string,
  attempts: Omit<QuizAttempt, "id" | "answered_at">[],
): Promise<void> {
  const { error } = await getSupabaseAdmin()
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
  const { data, error } = await getSupabaseAdmin()
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
      if (!isUsableSermonRef(r.slug)) return false;
      if (seen.has(r.slug)) return false;
      seen.add(r.slug);
      return true;
    });

    // Each ref gives exactly one recommendation, so the first six refs are
    // the six shown. Their WordPress lookups run in parallel (they used to
    // run one after another) and are cached for an hour.
    const targeted = await Promise.all(
      uniqueRefs.slice(0, 6).map((ref) => cachedRecommendation(ref)),
    );
    recommendations.push(...targeted);
  }

  // 2. Category-based fallback: use content_mapping if available
  if (weakAreas.length > 0 && recommendations.length < 6) {
    await addCategoryRecommendations(recommendations, weakAreas);
  }

  return recommendations;
}

const RECOMMENDATION_TTL_MS = 60 * 60 * 1000;
const recommendationCache = new Map<
  string,
  { at: number; value: Promise<Recommendation> }
>();

/** A sermon_ref's recommendation, cached per server instance for an hour. */
function cachedRecommendation(ref: {
  slug: string;
  category: string;
}): Promise<Recommendation> {
  const key = `${ref.slug}|${ref.category}`;
  const hit = recommendationCache.get(key);
  if (hit && Date.now() - hit.at < RECOMMENDATION_TTL_MS) return hit.value;
  const value = recommendationForRef(ref);
  recommendationCache.set(key, { at: Date.now(), value });
  // Don't keep a fallback (WordPress was down or found nothing): retry next time.
  void value.then((r) => {
    const fallback = !r.listen_url || r.title?.startsWith("Audio Message #");
    if (fallback && recommendationCache.get(key)?.value === value) {
      recommendationCache.delete(key);
    }
  });
  if (recommendationCache.size > 500) {
    const oldest = recommendationCache.keys().next().value;
    if (oldest !== undefined) recommendationCache.delete(oldest);
  }
  return value;
}

/**
 * A sermon_ref the recommendation can be built from: a numeric audio id or a
 * transcript slug. Some questions have a sentence in that field instead (a
 * data-entry slip); those get no targeted recommendation.
 */
export function isUsableSermonRef(ref: string): boolean {
  return /^\d+$/.test(ref) || (/^[a-z0-9][a-z0-9-]*$/i.test(ref) && ref.length <= 150);
}

const STOP_WORDS = new Set(
  "a an the of in on at to for and or but is are was were be by with from as its it that this not no".split(" "),
);

/** The transcript's real title (the audio message has the same title). */
async function transcriptTitle(slug: string): Promise<string | null> {
  try {
    const t = await getTranscriptBySlug(slug);
    return t?.title ? plainTitle(t.title) : null;
  } catch {
    return null;
  }
}

async function recommendationForRef(ref: {
  slug: string;
  category: string;
}): Promise<Recommendation> {
  if (/^\d+$/.test(ref.slug)) {
    // sermon_ref is a numeric audio sermon ID: link directly.
    const audioId = parseInt(ref.slug, 10);
    let title = `Audio Message #${audioId}`;
    try {
      const sermon = await getAudioSermonDetail(audioId);
      if (sermon?.title) title = sermon.title;
    } catch {
      // keep the fallback title
    }
    return {
      category: ref.category as QuizCategory,
      title,
      reason: "Listen to this sermon — you missed questions from it",
      listen_url: `/sermons/audio/${audioId}`,
    };
  }

  // sermon_ref is a transcript slug, and the audio message carries the
  // transcript's title. Find the audio with THAT title (lib/sermonMatch):
  // same part number, exact or near-exact words, never just the first result.
  const title = (await transcriptTitle(ref.slug)) ?? titleFromSlug(ref.slug);
  const base = titleKey(title).base;
  const searchQuery = base
    .split(" ")
    .filter((w) => !STOP_WORDS.has(w))
    .slice(0, 6)
    .join(" ");

  let match: { id: number; title: string } | null = null;
  try {
    const { data } = await getAudioSermons({ search: searchQuery, perPage: 20, page: 1 });
    match = matchSermonTitle(title, data);
  } catch (error) {
    console.warn("Audio sermon search failed for:", ref.slug, error);
  }

  return {
    category: ref.category as QuizCategory,
    title: match?.title.trim() || title,
    reason: match
      ? "You missed questions from this sermon — listen or read"
      : "You missed questions from this sermon — read the transcript",
    // No audio link rather than a wrong one.
    listen_url: match ? `/sermons/audio/${match.id}` : undefined,
    read_url: `/transcripts/${ref.slug}`,
  };
}

/** Category-based fallback (content_mapping), up to six recommendations in all. */
async function addCategoryRecommendations(
  recommendations: Recommendation[],
  weakAreas: WeakArea[],
): Promise<void> {
  const coveredSlugs = new Set(
    recommendations
      .filter((r) => r.read_url)
      .map((r) => r.read_url!.replace("/transcripts/", "")),
  );
  const categories = weakAreas.map((w) => w.category);

  try {
    const { data: catContent } = await getSupabaseAdmin()
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
  const [questions, weakAreas] = await Promise.all([
    fetchQuestionsByIds(
      attempts.filter((a) => !a.is_correct).map((a) => a.question_id),
    ),
    getWeakAreas(sessionId),
  ]);
  for (const question of questions) {
    failedQuestions.push({ question, explanation: question.explain });
  }

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
