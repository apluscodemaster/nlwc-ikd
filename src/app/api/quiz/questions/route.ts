import { NextRequest, NextResponse } from "next/server";
import { fetchQuizQuestions } from "@/lib/quizService";
import type { QuizCategory } from "@/types/quiz";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") as QuizCategory | null;
    const count = Math.min(Number(searchParams.get("count")) || 10, 25);

    const questions = await fetchQuizQuestions(category || undefined, count);

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
