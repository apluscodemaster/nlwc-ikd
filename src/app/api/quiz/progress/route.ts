import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  getWeakAreas,
  getRecommendations,
  fetchQuestionById,
} from "@/lib/quizService";
import type { QuizResult } from "@/types/quiz";

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

    const correct = attempts.filter((a: any) => a.is_correct).length;
    const total = attempts.length;

    const byCategory: Record<string, { correct: number; total: number }> = {};
    for (const a of attempts) {
      const category = a.category as string;
      if (!byCategory[category]) {
        byCategory[category] = { correct: 0, total: 0 };
      }
      byCategory[category]!.total++;
      if (a.is_correct) byCategory[category]!.correct++;
    }

    // Get weak areas and recommendations
    const weakAreas = await getWeakAreas(session_id);
    const recommendations = await getRecommendations(weakAreas);

    // Get failed questions with explanations
    const failedQuestions: Array<{
      question: any;
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
