import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { QuizCategory } from "@/types/quiz";

// ── GET: List all questions (admin only — no answer stripping) ──
export async function GET() {
  try {
    const snapshot = await adminDb.collection("quiz_questions").orderBy("category").get();

    const questions = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}

// ── POST: Create a new question ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      question,
      options,
      correctAnswer,
      category,
      difficulty,
      sermon_ref,
    } = body;

    if (!question || !options || correctAnswer === undefined || !category) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: question, options, correctAnswer, category",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
      return NextResponse.json(
        { error: "Options must be an array of 2-6 items" },
        { status: 400 },
      );
    }

    if (
      typeof correctAnswer !== "number" ||
      correctAnswer < 0 ||
      correctAnswer >= options.length
    ) {
      return NextResponse.json(
        { error: "correctAnswer must be a valid index into options" },
        { status: 400 },
      );
    }

    const validCategories: QuizCategory[] = [
      "Sunday Message",
      "Sunday School",
      "Bible Study",
      "Special Meeting",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const docData: Record<string, unknown> = {
      question: question.trim(),
      options: options.map((o: string) => o.trim()),
      correctAnswer,
      category,
    };

    if (difficulty) docData.difficulty = difficulty;
    if (sermon_ref) docData.sermon_ref = sermon_ref.trim();

    const docRef = await adminDb.collection("quiz_questions").add(docData);

    return NextResponse.json({ id: docRef.id, ...docData }, { status: 201 });
  } catch (error) {
    console.error("Failed to create question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 },
    );
  }
}

// ── PUT: Update a question ──
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 },
      );
    }

    if (updates.options) {
      if (
        !Array.isArray(updates.options) ||
        updates.options.length < 2 ||
        updates.options.length > 6
      ) {
        return NextResponse.json(
          { error: "Options must be an array of 2-6 items" },
          { status: 400 },
        );
      }
      updates.options = updates.options.map((o: string) => o.trim());
    }

    if (updates.correctAnswer !== undefined && updates.options) {
      if (
        updates.correctAnswer < 0 ||
        updates.correctAnswer >= updates.options.length
      ) {
        return NextResponse.json(
          { error: "correctAnswer must be a valid index into options" },
          { status: 400 },
        );
      }
    }

    if (updates.question) updates.question = updates.question.trim();
    if (updates.sermon_ref) updates.sermon_ref = updates.sermon_ref.trim();

    const ref = adminDb.collection("quiz_questions").doc(id);
    await ref.update(updates);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to update question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 },
    );
  }
}

// ── DELETE: Remove a question ──
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 },
      );
    }

    const ref = adminDb.collection("quiz_questions").doc(id);
    await ref.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 },
    );
  }
}
