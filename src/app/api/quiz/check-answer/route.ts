import { NextRequest, NextResponse } from "next/server";
import { fetchQuestionById } from "@/lib/quizService";

export async function POST(req: NextRequest) {
  try {
    const { question_id, selected_answer } = await req.json();

    if (!question_id || selected_answer === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Fetch the question from Firebase to get the correct answer
    const question = await fetchQuestionById(question_id);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    const is_correct = selected_answer === question.correctAnswer;

    return NextResponse.json(
      {
        is_correct,
        correct_answer: question.correctAnswer,
        explanation: question.explain || null,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Check answer error:", error);
    return NextResponse.json(
      { error: "Failed to check answer" },
      { status: 500 },
    );
  }
}
