import { NextResponse } from "next/server";
import { fetchQuestionById, buildQuizResult } from "@/lib/quizService";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";

const submitSchema = z.object({
  session_id: z.string().uuid(),
  answers: z.array(
    z.object({
      question_id: z.string(),
      category: z.string(),
      selected_answer: z.number().min(0),
    }),
  ),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = submitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid data" },
        { status: 400 },
      );
    }

    const { session_id, answers } = result.data;

    // Verify session exists
    const { data: sessionData } = await getSupabase()
      .from("sessions")
      .select("session_id")
      .eq("session_id", session_id)
      .single();

    if (!sessionData) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Validate answers server-side against Firebase
    const attempts = [];
    for (const answer of answers) {
      const question = await fetchQuestionById(answer.question_id);
      if (!question) continue;

      attempts.push({
        session_id,
        question_id: answer.question_id,
        category: question.category,
        is_correct: question.correctAnswer === answer.selected_answer,
      });
    }

    if (attempts.length === 0) {
      return NextResponse.json(
        { error: "No valid questions found" },
        { status: 400 },
      );
    }

    // Build result (saves attempts, computes weak areas, gets recommendations)
    const quizResult = await buildQuizResult(session_id, attempts);

    // Atomic score increment via RPC
    const score = quizResult.correct_answers;
    await getSupabase().rpc("increment_quiz_count", {
      sid: session_id,
      points: score,
    });

    return NextResponse.json(quizResult, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Quiz submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 },
    );
  }
}
