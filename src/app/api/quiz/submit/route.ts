import { NextResponse, type NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { fetchQuestionById, buildQuizResult } from "@/lib/quizService";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";

/** A quiz serves at most 25 questions (see /api/quiz/questions). */
const MAX_ANSWERS = 25;

const submitSchema = z.object({
  session_id: z.string().uuid(),
  // Bounded: every answer costs a Firestore read, so an unbounded array let a
  // single request trigger any number of reads.
  answers: z
    .array(
      z.object({
        question_id: z.string().min(1).max(200),
        category: z.string().max(200),
        selected_answer: z.number().int().min(0).max(20),
      }),
    )
    .min(1)
    .max(MAX_ANSWERS),
});

export async function POST(req: NextRequest) {
  // Rate limited: writes attempts + builds results.
  const limited = rateLimitMiddleware(req, "public");
  if (limited) return limited;

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

    // One answer per question — a repeated question_id would otherwise fail
    // the (session_id, question_id) unique constraint and reject the whole
    // submission.
    const uniqueAnswers = [
      ...new Map(answers.map((a) => [a.question_id, a])).values(),
    ];

    // Validate answers server-side against Firebase (in parallel).
    const questions = await Promise.all(
      uniqueAnswers.map((a) => fetchQuestionById(a.question_id)),
    );
    const attempts = [];
    const failedSermonRefs: { slug: string; category: string }[] = [];
    for (const [i, answer] of uniqueAnswers.entries()) {
      const question = questions[i];
      if (!question) continue;

      const isCorrect = question.correctAnswer === answer.selected_answer;
      attempts.push({
        session_id,
        question_id: answer.question_id,
        category: question.category,
        is_correct: isCorrect,
      });

      // Collect sermon_ref + category from wrong answers for targeted recommendations
      if (!isCorrect && question.sermon_ref) {
        failedSermonRefs.push({
          slug: question.sermon_ref,
          category: question.category,
        });
      }
    }

    if (attempts.length === 0) {
      return NextResponse.json(
        { error: "No valid questions found" },
        { status: 400 },
      );
    }

    // Build result (saves attempts, computes weak areas, gets recommendations)
    const quizResult = await buildQuizResult(
      session_id,
      attempts,
      failedSermonRefs,
    );

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
