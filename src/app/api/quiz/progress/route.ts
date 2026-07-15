import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  getWeakAreas,
  getRecommendations,
  fetchQuestionById,
} from "@/lib/quizService";
import type { QuizResult, QuizQuestion } from "@/types/quiz";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const session_id = searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 },
      );
    }

    // Get all attempts for this session
    const { data: attempts, error: attemptsError } = await getSupabase()
      .from("quiz_attempts")
      .select("*")
      .eq("session_id", session_id);

    if (attemptsError || !attempts) {
      return NextResponse.json(
        { error: "Failed to fetch attempts" },
        { status: 500 },
      );
    }

    // Deduplicate: keep only the latest attempt per question_id
    const latestByQuestion = new Map<string, (typeof attempts)[0]>();
    for (const a of attempts) {
      const existing = latestByQuestion.get(a.question_id);
      if (
        !existing ||
        new Date(a.answered_at) > new Date(existing.answered_at)
      ) {
        latestByQuestion.set(a.question_id, a);
      }
    }
    const uniqueAttempts = Array.from(latestByQuestion.values());

    // `uniqueAttempts` elements are already typed from the map above.
    const correct = uniqueAttempts.filter((a) => a.is_correct).length;
    const total = uniqueAttempts.length;

    const byCategory: Record<string, { correct: number; total: number }> = {};
    for (const a of uniqueAttempts) {
      const category = a.category as string;
      if (!byCategory[category]) {
        byCategory[category] = { correct: 0, total: 0 };
      }
      byCategory[category]!.total++;
      if (a.is_correct) byCategory[category]!.correct++;
    }

    // Get weak areas and recommendations
    const weakAreas = await getWeakAreas(session_id);

    // Collect sermon_refs and failed question data in a single pass
    const failedSermonRefs: { slug: string; category: string }[] = [];
    const failedQuestions: Array<{
      question: QuizQuestion;
      explanation?: string;
    }> = [];
    for (const attempt of uniqueAttempts) {
      if (!attempt.is_correct) {
        const question = await fetchQuestionById(attempt.question_id);
        if (question) {
          failedQuestions.push({
            question,
            explanation: question.explain,
          });
          if (question.sermon_ref) {
            failedSermonRefs.push({
              slug: question.sermon_ref,
              category: question.category,
            });
          }
        }
      }
    }

    const recommendations = await getRecommendations(
      weakAreas,
      failedSermonRefs,
    );

    const result: QuizResult = {
      total_questions: total,
      correct_answers: correct,
      score_percent: total > 0 ? Math.round((correct / total) * 100) : 0,
      by_category: byCategory,
      recommendations,
      failed_questions: failedQuestions,
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Get progress error:", error);
    return NextResponse.json(
      { error: "Failed to get progress" },
      { status: 500 },
    );
  }
}
