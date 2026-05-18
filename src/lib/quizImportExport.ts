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
    const options = q.options.map((_, idx) => q.options[idx] || "");
    // Pad to 4 options
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
    if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
      throw new Error("Invalid question format");
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
  const lines = csvStr.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have header and at least one row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const questionIdx = headers.indexOf("question");
  const categoryIdx = headers.indexOf("category");
  const correctAnswerIdx = headers.indexOf("correct answer (index)");
  const sermonRefIdx = headers.indexOf("sermon ref");
  const explanationIdx = headers.indexOf("explanation");

  if (questionIdx === -1 || categoryIdx === -1 || correctAnswerIdx === -1) {
    throw new Error(
      "CSV must have 'Question', 'Category', and 'Correct Answer (Index)' columns",
    );
  }

  const questions: QuizQuestion[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser that handles quoted values
    const values = parseCSVLine(line);

    const options: string[] = [];
    for (let j = 2; j <= 5; j++) {
      if (j < values.length && values[j]?.trim()) {
        options.push(values[j].trim());
      }
    }

    if (options.length < 2) {
      throw new Error(`Row ${i + 1}: At least 2 options required`);
    }

    questions.push({
      id: "", // Empty ID for auto-generation on import
      question: values[questionIdx]?.trim() || "",
      options,
      correctAnswer: parseInt(values[correctAnswerIdx] || "0", 10),
      category:
        (values[categoryIdx]?.trim() as QuizCategory) || "Sunday Message",
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
