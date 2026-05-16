import { NextRequest, NextResponse } from "next/server";
import { fetchQuizQuestions } from "@/lib/quizService";
import type { QuizCategory } from "@/types/quiz";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") as QuizCategory | null;
    const count = Math.min(Number(searchParams.get("count")) || 10, 25);
    const excludeParam = searchParams.get("exclude");
    const excludeIds = excludeParam
      ? excludeParam.split(",").filter(Boolean)
      : [];

    // When there are exclusions, fetch more questions to account for filtering
    const fetchCount =
      excludeIds.length > 0
        ? Math.min(count + excludeIds.length + 5, 25)
        : count;

    const questions = await fetchQuizQuestions(
      category || undefined,
      fetchCount,
    );

    // Filter out already-answered questions
    const filtered = questions.filter((q) => !excludeIds.includes(q.id));

    // Return only the requested count
    const result = filtered.slice(0, count);

    if (result.length === 0) {
      console.warn(
        `No questions available for category=${category}, count=${count}, excludeIds=${excludeIds.length}`,
      );
    }

    // Strip correctAnswer before sending to client
    const safe = result.map(({ correctAnswer: _, ...rest }) => rest);

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
