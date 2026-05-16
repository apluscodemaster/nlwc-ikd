import { NextRequest, NextResponse } from "next/server";
import { fetchQuestionById, saveQuizAttempts } from "@/lib/quizService";
import { getSupabase } from "@/lib/supabase";
import type { QuizAttempt } from "@/types/quiz";

export async function POST(req: NextRequest) {
  try {
    const { session_id, answer } = await req.json();

    if (!session_id || !answer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { question_id, selected_answer, category } = answer;

    // Fetch question to verify correctness
    const question = await fetchQuestionById(question_id);
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const is_correct = selected_answer === question.correctAnswer;

    // Save attempt immediately
    const attempt: Omit<QuizAttempt, "id" | "answered_at"> = {
      session_id,
      question_id,
      category,
      is_correct,
    };

    await saveQuizAttempts(session_id, [attempt]);

    // Increment score if correct
    if (is_correct) {
      try {
        await getSupabase().rpc("increment_quiz_count", {
          sid: session_id,
          points: 1,
        });
      } catch (error) {
        console.error("Failed to increment score:", error);
      }
    }

    return NextResponse.json(
      {
        is_correct,
        correct_answer: question.correctAnswer,
        explanation: question.explain || null,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json(
      { error: "Failed to save answer" },
      { status: 500 }
    );
  }
}
