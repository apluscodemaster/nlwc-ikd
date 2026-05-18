import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { QuizCategory } from "@/types/quiz";

// ── GET: List all questions (admin only — no answer stripping) ──
export async function GET() {
  try {
    const adminDb = getAdminDb();
    const snapshot = await adminDb
      .collection("quiz_questions")
      .orderBy("category")
      .get();

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

// ── Shared validation for a single question payload ──
const VALID_CATEGORIES: QuizCategory[] = [
  "Sunday Message",
  "Sunday School",
  "Bible Study",
  "Special Meeting",
];

function validateQuestion(body: Record<string, unknown>): {
  valid: true;
  data: Record<string, unknown>;
} | {
  valid: false;
  error: string;
} {
  const { question, options, correctAnswer, category, sermon_ref, explain } =
    body;

  if (!question || !options || correctAnswer === undefined || !category) {
    return {
      valid: false,
      error:
        "Missing required fields: question, options, correctAnswer, category",
    };
  }

  if (!Array.isArray(options)) {
    return { valid: false, error: "Options must be an array" };
  }

  // Filter out empty options, cap at 4
  const filteredOptions = options
    .map((o: unknown) => (typeof o === "string" ? o.trim() : ""))
    .filter(Boolean)
    .slice(0, 4);

  if (filteredOptions.length < 2 || filteredOptions.length > 4) {
    return {
      valid: false,
      error: `Options must have 2-4 non-empty items (got ${filteredOptions.length})`,
    };
  }

  const rawAnswer =
    typeof correctAnswer === "string"
      ? parseInt(correctAnswer, 10)
      : Number(correctAnswer);

  // Fallback NaN to 0 so imports don't break on bad data
  let parsedCorrectAnswer = isNaN(rawAnswer) ? 0 : rawAnswer;

  // Clamp to valid range
  if (parsedCorrectAnswer < 0) parsedCorrectAnswer = 0;
  if (parsedCorrectAnswer >= filteredOptions.length) {
    parsedCorrectAnswer = filteredOptions.length - 1;
  }

  const catStr =
    typeof category === "string" ? category.trim().toLowerCase() : "";
  const matchedCategory = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === catStr,
  );
  if (!matchedCategory) {
    return {
      valid: false,
      error: `Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`,
    };
  }

  const questionText =
    typeof question === "string" ? question.trim() : String(question);
  if (!questionText) {
    return { valid: false, error: "Question text is empty" };
  }

  const docData: Record<string, unknown> = {
    question: questionText,
    options: filteredOptions,
    correctAnswer: parsedCorrectAnswer,
    category: matchedCategory,
    created_at: new Date().toISOString(),
  };

  if (sermon_ref && typeof sermon_ref === "string" && sermon_ref.trim()) {
    docData.sermon_ref = sermon_ref.trim();
  }
  if (explain && typeof explain === "string" && explain.trim()) {
    docData.explain = explain.trim();
  }

  return { valid: true, data: docData };
}

// ── POST: Create question(s) — supports single or bulk ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Bulk mode: { questions: [...] } ──
    if (body.questions && Array.isArray(body.questions)) {
      const adminDb = getAdminDb();
      const results: {
        added: number;
        failed: number;
        errors: { index: number; question: string; error: string }[];
      } = { added: 0, failed: 0, errors: [] };

      for (let i = 0; i < body.questions.length; i++) {
        const q = body.questions[i];
        const validation = validateQuestion(q);

        if (!validation.valid) {
          results.failed++;
          results.errors.push({
            index: i,
            question:
              typeof q?.question === "string"
                ? q.question.slice(0, 60)
                : `(row ${i + 1})`,
            error: validation.error,
          });
          continue;
        }

        try {
          await adminDb.collection("quiz_questions").add(validation.data);
          results.added++;
        } catch (writeErr) {
          results.failed++;
          results.errors.push({
            index: i,
            question:
              typeof q?.question === "string"
                ? q.question.slice(0, 60)
                : `(row ${i + 1})`,
            error:
              writeErr instanceof Error
                ? writeErr.message
                : "Firestore write failed",
          });
        }
      }

      const status = results.failed > 0 && results.added === 0 ? 400 : 200;
      return NextResponse.json(results, { status });
    }

    // ── Single mode (backward-compatible) ──
    const validation = validateQuestion(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const docRef = await adminDb
      .collection("quiz_questions")
      .add(validation.data);

    return NextResponse.json(
      { id: docRef.id, ...validation.data },
      { status: 201 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to create question(s):", errorMessage);
    return NextResponse.json(
      { error: "Failed to create question(s)", details: errorMessage },
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
      if (!Array.isArray(updates.options)) {
        return NextResponse.json(
          { error: "Options must be an array" },
          { status: 400 },
        );
      }
      updates.options = updates.options
        .map((o: string) => (typeof o === "string" ? o.trim() : ""))
        .filter(Boolean)
        .slice(0, 4);
      if (updates.options.length < 2 || updates.options.length > 4) {
        return NextResponse.json(
          { error: "Options must have 2-4 non-empty items" },
          { status: 400 },
        );
      }
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

    const adminDb = getAdminDb();
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

    const adminDb = getAdminDb();
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
