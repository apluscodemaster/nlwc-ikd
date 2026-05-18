import type { QuizCategory, QuizQuestion } from "@/types/quiz";

const VALID_CATEGORIES: QuizCategory[] = [
  "Sunday Message",
  "Sunday School",
  "Bible Study",
  "Special Meeting",
];

// ── Export ──────────────────────────────────────────────────────────────────

export function exportQuizAsJSON(questions: QuizQuestion[]): string {
  return JSON.stringify(questions, null, 2);
}

export function exportQuizAsCSV(questions: QuizQuestion[]): string {
  if (questions.length === 0) return "";

  const headers = [
    "ID",
    "Question",
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
    "Correct Answer (Index)",
    "Category",
    "Sermon Ref",
    "Explanation",
  ];

  const rows = questions.map((q) => {
    const options = q.options.map((_, idx) => q.options[idx] || "");
    while (options.length < 4) options.push("");

    return [
      q.id,
      `"${(q.question || "").replace(/"/g, '""')}"`,
      `"${(options[0] || "").replace(/"/g, '""')}"`,
      `"${(options[1] || "").replace(/"/g, '""')}"`,
      `"${(options[2] || "").replace(/"/g, '""')}"`,
      `"${(options[3] || "").replace(/"/g, '""')}"`,
      q.correctAnswer,
      q.category,
      q.sermon_ref || "",
      `"${(q.explain || "").replace(/"/g, '""')}"`,
    ];
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Import ──────────────────────────────────────────────────────────────────

export async function importQuizFromFile(file: File): Promise<QuizQuestion[]> {
  const text = await file.text();

  if (file.name.endsWith(".json")) {
    return importQuizFromJSON(text);
  } else if (file.name.endsWith(".csv")) {
    return importQuizFromCSV(text);
  } else {
    throw new Error("Unsupported file format. Please use .json or .csv");
  }
}

// ── JSON ─────────────────────────────────────────────────────────────────────

function importQuizFromJSON(jsonStr: string): QuizQuestion[] {
  const data = JSON.parse(jsonStr);

  if (!Array.isArray(data)) {
    throw new Error("JSON must be an array of questions");
  }

  return data.map((q, idx) => {
    if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Item ${idx + 1}: invalid question format`);
    }

    // Coerce correctAnswer to number — it may come in as a string
    const correctAnswer = Number(q.correctAnswer ?? 0);
    if (
      !Number.isInteger(correctAnswer) ||
      correctAnswer < 0 ||
      correctAnswer >= q.options.length
    ) {
      throw new Error(
        `Item ${idx + 1}: correctAnswer "${q.correctAnswer}" is out of range`,
      );
    }

    const category = normalizeCategory(q.category);
    if (!category) {
      throw new Error(
        `Item ${idx + 1}: unknown category "${q.category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      );
    }

    return {
      id: "",
      question: String(q.question).trim(),
      options: q.options.map((o: unknown) => String(o).trim()),
      correctAnswer, // guaranteed number
      category, // guaranteed valid QuizCategory
      sermon_ref: q.sermon_ref?.trim() || undefined,
      explain: q.explain?.trim() || undefined,
    };
  });
}

// ── CSV ──────────────────────────────────────────────────────────────────────

function importQuizFromCSV(csvStr: string): QuizQuestion[] {
  const lines = csvStr
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .split("\n");

  if (lines.length < 2) {
    throw new Error("CSV must have a header row and at least one data row");
  }

  // Parse header with proper quoted-field handling so column detection is reliable
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  const questionIdx = headers.indexOf("question");
  const categoryIdx = headers.indexOf("category");
  const correctAnswerIdx = headers.indexOf("correct answer (index)");
  const sermonRefIdx = headers.indexOf("sermon ref");
  const explanationIdx = headers.indexOf("explanation");

  // Locate option columns by name so position in the file doesn't matter
  const optionIndices: number[] = [];
  for (const label of ["option 1", "option 2", "option 3", "option 4"]) {
    const i = headers.indexOf(label);
    if (i !== -1) optionIndices.push(i);
  }

  if (questionIdx === -1) throw new Error("CSV is missing a 'Question' column");
  if (categoryIdx === -1) throw new Error("CSV is missing a 'Category' column");
  if (correctAnswerIdx === -1)
    throw new Error("CSV is missing a 'Correct Answer (Index)' column");
  if (optionIndices.length < 2)
    throw new Error("CSV must have at least 'Option 1' and 'Option 2' columns");

  const questions: QuizQuestion[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    const question = values[questionIdx]?.trim() ?? "";
    if (!question) continue;

    // Collect options from named columns only, dropping empty trailing ones
    const options = optionIndices
      .map((idx) => values[idx]?.trim() ?? "")
      .filter(Boolean);

    if (options.length < 2) {
      console.warn(`Row ${i + 1}: fewer than 2 valid options — skipping`);
      continue;
    }

    // parseInt because CSV values are always strings
    const correctAnswer = parseInt(values[correctAnswerIdx]?.trim() ?? "0", 10);
    if (
      isNaN(correctAnswer) ||
      correctAnswer < 0 ||
      correctAnswer >= options.length
    ) {
      console.warn(
        `Row ${i + 1}: correctAnswer "${values[correctAnswerIdx]}" is out of range for ${options.length} options — skipping`,
      );
      continue;
    }

    // Validate and normalize — rejects unknown values instead of blindly casting
    const category = normalizeCategory(values[categoryIdx]?.trim() ?? "");
    if (!category) {
      console.warn(
        `Row ${i + 1}: unknown category "${values[categoryIdx]}" — skipping. Valid: ${VALID_CATEGORIES.join(", ")}`,
      );
      continue;
    }

    questions.push({
      id: "",
      question,
      options,
      correctAnswer, // number, always
      category, // validated QuizCategory, always
      sermon_ref:
        sermonRefIdx !== -1
          ? values[sermonRefIdx]?.trim() || undefined
          : undefined,
      explain:
        explanationIdx !== -1
          ? values[explanationIdx]?.trim() || undefined
          : undefined,
    });
  }

  if (questions.length === 0) {
    throw new Error(
      "No valid questions found in CSV. Check column names and data.",
    );
  }

  return questions;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped double-quote inside a quoted field
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Case-insensitive match against known QuizCategory values.
 * Includes fuzzy fallbacks for common short-forms.
 * Returns null if no match — caller decides whether to skip or throw.
 */
function normalizeCategory(raw: string): QuizCategory | null {
  const trimmed = raw.trim();

  // Exact match (case-insensitive)
  const exact = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase(),
  );
  if (exact) return exact;

  // Fuzzy fallback
  const lower = trimmed.toLowerCase();
  if (lower.includes("sunday") && lower.includes("school"))
    return "Sunday School";
  if (lower.includes("sunday")) return "Sunday Message";
  if (lower.includes("bible")) return "Bible Study";
  if (lower.includes("special") || lower.includes("conference"))
    return "Special Meeting";

  return null;
}
