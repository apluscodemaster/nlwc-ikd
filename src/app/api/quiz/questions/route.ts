import { NextRequest, NextResponse } from "next/server";
import { fetchQuizQuestions } from "@/lib/quizService";
import { getSupabase } from "@/lib/supabase";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import type { QuizCategory } from "@/types/quiz";

/**
 * Rate limited because this is the most expensive public endpoint in the app:
 * it does a Supabase read for the session's answered ids, then over-fetches from
 * Firestore proportionally to that count (see fetchQuizQuestions) — a player
 * deep into the bank can cost ~1k document reads per question. Unthrottled, an
 * anonymous caller could loop this and burn the Firestore quota.
 *
 * The "public" tier (100/min) is far above real play (~1 question per 10-30s).
 */
export async function GET(req: NextRequest) {
  const limited = rateLimitMiddleware(req, "public");
  if (limited) return limited;

  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") as QuizCategory | null;
    const count = Math.min(Number(searchParams.get("count")) || 10, 25);
    const sessionId = searchParams.get("session_id");
    const excludeParam = searchParams.get("exclude");
    const clientExclude = excludeParam
      ? excludeParam.split(",").filter(Boolean)
      : [];

    // Exclusions are computed server-side from Supabase (every question this
    // session has already answered) and unioned with the small client-supplied
    // list (which covers the latest answer, not yet persisted). Doing this on
    // the server means the exclude set never has to travel in the URL, so it
    // can't hit request-length limits as a player's answered count grows into
    // the hundreds/thousands.
    let dbAnswered: string[] = [];
    if (sessionId) {
      let answeredQuery = getSupabase()
        .from("quiz_attempts")
        .select("question_id")
        .eq("session_id", sessionId);
      if (category) answeredQuery = answeredQuery.eq("category", category);
      const { data, error } = await answeredQuery;
      if (error) {
        console.warn("Failed to load answered IDs for exclusion:", error);
      } else {
        dbAnswered = (data ?? []).map((row) => row.question_id as string);
      }
    }

    const excludeIds = [...new Set([...dbAnswered, ...clientExclude])];

    // Fetch questions with exclusions handled at the service layer
    const questions = await fetchQuizQuestions(
      category || undefined,
      count,
      excludeIds,
    );

    if (questions.length === 0) {
      console.warn(
        `No questions available for category=${category}, count=${count}, excludeIds=${excludeIds.length}`,
      );
    }

    // Strip correctAnswer before sending to client
    const safe = questions.map(({ correctAnswer: _, ...rest }) => rest);

    return NextResponse.json(safe, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to fetch quiz questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}
