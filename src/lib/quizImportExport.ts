import type { QuizCategory, QuizQuestion } from "@/types/quiz";

// ── Export ──

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
    const options = [...q.options];
    // Pad to exactly 4 options to enforce the 4-item rule
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

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  return csv;
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

// ── Import ──

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

function importQuizFromJSON(jsonStr: string): QuizQuestion[] {
  const data = JSON.parse(jsonStr);

  if (!Array.isArray(data)) {
    throw new Error("JSON must be an array of questions");
  }

  return data.map((q) => {
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error("Invalid question format. Each question must have exactly 4 options.");
    }
    // Strip ID to let Firebase auto-generate on import
    return {
      id: "", // Empty ID for auto-generation
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer ?? 0,
      category: q.category || "Sunday Message",
      sermon_ref: q.sermon_ref,
      explain: q.explain,
    };
  });
}

function importQuizFromCSV(csvStr: string): QuizQuestion[] {
  // Strip BOM (common in Excel-exported CSVs)
  const clean = csvStr.replace(/^\uFEFF/, "").trim();
  const lines = clean.split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have header and at least one row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const questionIdx = headers.indexOf("question");
  const categoryIdx = headers.indexOf("category");
  // Support both "correct answer (index)" and "correct answer"
  let correctAnswerIdx = headers.indexOf("correct answer (index)");
  if (correctAnswerIdx === -1)
    correctAnswerIdx = headers.indexOf("correct answer");
  const sermonRefIdx = headers.indexOf("sermon ref");
  const explanationIdx = headers.indexOf("explanation");

  if (questionIdx === -1 || categoryIdx === -1 || correctAnswerIdx === -1) {
    throw new Error(
      "CSV must have 'Question', 'Category', and 'Correct Answer (Index)' (or 'Correct Answer') columns",
    );
  }

  // Dynamically find Option columns if they exist, otherwise fallback to columns 2,3,4,5
  const optIndices = [
    headers.indexOf("option 1"),
    headers.indexOf("option 2"),
    headers.indexOf("option 3"),
    headers.indexOf("option 4"),
  ];

  const hasOptHeaders = optIndices.some((idx) => idx !== -1);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser that handles quoted values
    const values = parseCSVLine(line);

    let options: string[] = [];
    if (hasOptHeaders) {
      for (const idx of optIndices) {
        if (idx !== -1 && idx < values.length && values[idx]?.trim()) {
          options.push(values[idx].trim());
        } else {
          options.push(""); // Keep empty space to maintain array length
        }
      }
    } else {
      // Fallback: assume options are in columns 2, 3, 4, 5
      for (let j = 2; j <= 5; j++) {
        if (j < values.length && values[j]?.trim()) {
          options.push(values[j].trim());
        } else {
          options.push("");
        }
      }
    }

    // Filter out empties and pad to exactly 4 items
    options = options.filter(Boolean);
    while (options.length < 4) {
      options.push("");
    }

    if (options.filter(Boolean).length !== 4) {
      throw new Error(`Row ${i + 1}: Exactly 4 non-empty options required`);
    }

    // Parse correctAnswer — support 0-based index, 1-based index, or letter (A/B/C/D)
    const rawAnswer = (values[correctAnswerIdx] || "").trim();
    let correctAnswer: number;

    if (/^[A-Fa-f]$/i.test(rawAnswer)) {
      // Letter-based: A=0, B=1, C=2, etc.
      correctAnswer = rawAnswer.toUpperCase().charCodeAt(0) - 65;
    } else {
      const parsed = parseInt(rawAnswer, 10);
      if (isNaN(parsed)) {
        correctAnswer = 0;
      } else if (parsed >= 1 && parsed <= options.length && parsed > options.length - 1) {
        // Looks like 1-based (value equals option count) — convert to 0-based
        correctAnswer = parsed - 1;
      } else {
        correctAnswer = parsed;
      }
    }

    // Clamp to valid range
    if (correctAnswer < 0) correctAnswer = 0;
    if (correctAnswer >= options.length) correctAnswer = options.length - 1;

    questions.push({
      id: "", // Empty ID for auto-generation on import
      question: values[questionIdx]?.trim() || "",
      options,
      correctAnswer,
      category: (values[categoryIdx]?.trim() as QuizCategory) || "Sunday Message",
      sermon_ref: values[sermonRefIdx]?.trim(),
      explain: values[explanationIdx]?.trim(),
    });
  }

  return questions;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
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
